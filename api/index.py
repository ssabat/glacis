"""GlacierGuard backend: mock GLOF telemetry + token-lean Nemotron Nano analysis via Nebius Token Factory."""

import base64
import hashlib
import json
import os
import re
import time
import urllib.error
import urllib.request
from pathlib import Path
from typing import Literal

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

NEBIUS_URL = os.getenv("NEBIUS_BASE_URL", "https://api.tokenfactory.nebius.com/v1").rstrip("/")
MODEL = os.getenv("NEMOTRON_MODEL", "nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B")
PRICE_IN = float(os.getenv("NEBIUS_PRICE_IN_PER_M", "0.06"))
PRICE_OUT = float(os.getenv("NEBIUS_PRICE_OUT_PER_M", "0.24"))
MAX_OUT_TOKENS = 160
YEARS = list(range(2015, 2026))
PUBLIC_DIR = Path(__file__).resolve().parent.parent / "public"

app = FastAPI(docs_url="/api/py/docs", openapi_url="/api/py/openapi.json")

LAKES = {
    "imja-tsho": {
        "name": "Imja Tsho", "country": "Nepal", "cc": "NP", "region": "Khumbu, Solukhumbu",
        "lat": 27.898, "lon": 86.923, "elev_m": 5010, "dam": "moraine",
        "downstream_pop": 6200, "first_village": "Dingboche", "distance_km": 8,
        "area_km2": [1.28, 1.31, 1.34, 1.37, 1.41, 1.44, 1.48, 1.51, 1.55, 1.58, 1.62],
        "sensors": {"temp_anom_c": 0.9, "rain_72h_mm": 34, "level_24h_cm": 4, "seepage": 0.3, "seismic_m": 1.8},
        "visual": ["calving front", "new supraglacial ponds"],
    },
    "tsho-rolpa": {
        "name": "Tsho Rolpa", "country": "Nepal", "cc": "NP", "region": "Rolwaling, Dolakha",
        "lat": 27.861, "lon": 86.478, "elev_m": 4580, "dam": "moraine",
        "downstream_pop": 9800, "first_village": "Na", "distance_km": 6,
        "area_km2": [1.53, 1.55, 1.56, 1.58, 1.59, 1.61, 1.63, 1.65, 1.66, 1.68, 1.70],
        "sensors": {"temp_anom_c": 0.7, "rain_72h_mm": 22, "level_24h_cm": 2, "seepage": 0.2, "seismic_m": 1.2},
        "visual": ["stable outlet channel", "ice-cored moraine"],
    },
    "south-lhonak": {
        "name": "South Lhonak", "country": "India", "cc": "IN", "region": "North Sikkim",
        "lat": 27.911, "lon": 88.198, "elev_m": 5200, "dam": "moraine",
        "downstream_pop": 41000, "first_village": "Chungthang", "distance_km": 62,
        "area_km2": [1.35, 1.39, 1.43, 1.46, 1.50, 1.53, 1.57, 1.60, 1.64, 1.41, 1.45],
        "sensors": {"temp_anom_c": 1.2, "rain_72h_mm": 58, "level_24h_cm": 7, "seepage": 0.5, "seismic_m": 2.6},
        "visual": ["breach scar", "unstable lateral moraine", "hanging ice"],
    },
    "thorthormi": {
        "name": "Thorthormi", "country": "Bhutan", "cc": "BT", "region": "Lunana, Gasa",
        "lat": 28.102, "lon": 90.282, "elev_m": 4430, "dam": "moraine",
        "downstream_pop": 15500, "first_village": "Thanza", "distance_km": 5,
        "area_km2": [2.90, 3.05, 3.21, 3.36, 3.52, 3.67, 3.83, 3.98, 4.12, 4.27, 4.41],
        "sensors": {"temp_anom_c": 1.0, "rain_72h_mm": 41, "level_24h_cm": 5, "seepage": 0.4, "seismic_m": 1.5},
        "visual": ["merging supraglacial ponds", "thin moraine wall"],
    },
}

SCENARIOS = {
    "baseline": {},
    "cloudburst": {"rain_72h_mm": 140, "level_24h_cm": 28},
    "earthquake": {"seismic_m": 5.4, "seepage": 0.8},
    "heatwave": {"temp_anom_c": 3.1, "level_24h_cm": 15},
}

SYSTEM_PROMPT = (
    "GLOF early-warning analyst. Use trend+sensors+visual cues. Reply ONLY minified JSON: "
    '{"level":"low|moderate|high|critical","score":0-100,"drivers":[max 3 short],'
    '"actions":[max 3 short],"evac_h":hours_to_evacuate_or_null}'
)

_cache: dict[str, dict] = {}
_session = {"calls": 0, "cache_hits": 0, "tokens_in": 0, "tokens_out": 0, "cost_usd": 0.0}


class AnalyzeRequest(BaseModel):
    scenario: Literal["baseline", "cloudburst", "earthquake", "heatwave"] = "baseline"
    attach_image: bool = False


def _sensors(lake: dict, scenario: str) -> dict:
    return {**lake["sensors"], **SCENARIOS[scenario]}


def _growth_pct_per_year(areas: list[float]) -> float:
    return round((areas[-1] / areas[0] - 1) * 100 / (len(areas) - 1), 2)


def heuristic(lake: dict, s: dict) -> dict:
    growth = _growth_pct_per_year(lake["area_km2"])
    score = (
        growth * 6 + s["level_24h_cm"] * 1.4 + s["rain_72h_mm"] / 6
        + s["seepage"] * 22 + max(s["seismic_m"] - 1, 0) * 9 + s["temp_anom_c"] * 6
    )
    score = int(max(0, min(100, score)))
    level = "low" if score < 35 else "moderate" if score < 60 else "high" if score < 80 else "critical"
    drivers = sorted(
        [
            (growth * 6, f"Lake area +{growth}%/yr"),
            (s["level_24h_cm"] * 1.4, f"Water level +{s['level_24h_cm']}cm/24h"),
            (s["rain_72h_mm"] / 6, f"{s['rain_72h_mm']}mm rain/72h"),
            (s["seepage"] * 22, f"Moraine seepage index {s['seepage']}"),
            (max(s["seismic_m"] - 1, 0) * 9, f"Seismic M{s['seismic_m']}"),
        ],
        reverse=True,
    )
    actions = {
        "low": ["Continue weekly imagery review", "Maintain sensor uptime"],
        "moderate": ["Increase imagery cadence to daily", "Alert district DRR office", "Test sirens"],
        "high": ["Pre-position rescue teams", f"Warn {lake['first_village']} residents", "Close downstream trails"],
        "critical": [f"Evacuate {lake['first_village']} now", "Trigger siren network", "Notify national EOC"],
    }[level]
    wave_kmh = 18
    return {
        "level": level, "score": score,
        "drivers": [d for _, d in drivers[:3]], "actions": actions,
        "evac_h": round(lake["distance_km"] / wave_kmh, 1) if level in ("high", "critical") else None,
    }


def compact_prompt(lake: dict, s: dict) -> str:
    areas = ",".join(f"{a:g}" for a in lake["area_km2"])
    return (
        f"{lake['name']} {lake['cc']} {lake['elev_m']}m dam:{lake['dam']} pop:{lake['downstream_pop']} "
        f"d:{lake['distance_km']}km A(km2,2015-25):{areas} dT:+{s['temp_anom_c']}C "
        f"rain72:{s['rain_72h_mm']}mm lvl24:+{s['level_24h_cm']}cm seep:{s['seepage']} "
        f"seis:M{s['seismic_m']} vis:{';'.join(lake['visual'])}"
    )


def _image_data_url(lake_id: str) -> str | None:
    path = PUBLIC_DIR / "lakes" / f"{lake_id}.png"
    if not path.exists():
        return None
    return "data:image/png;base64," + base64.b64encode(path.read_bytes()).decode()


def _post(payload: dict, api_key: str) -> dict:
    req = urllib.request.Request(
        f"{NEBIUS_URL}/chat/completions",
        data=json.dumps(payload).encode(),
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=45) as res:
        return json.loads(res.read())


def _parse_json(text: str) -> dict | None:
    text = re.sub(r"<think>.*?</think>", "", text, flags=re.S)
    match = re.search(r"\{.*\}", text, flags=re.S)
    if not match:
        return None
    try:
        data = json.loads(match.group(0))
    except json.JSONDecodeError:
        return None
    if data.get("level") not in ("low", "moderate", "high", "critical"):
        return None
    return {
        "level": data["level"],
        "score": int(max(0, min(100, float(data.get("score", 0))))),
        "drivers": [str(d) for d in data.get("drivers", [])][:3],
        "actions": [str(a) for a in data.get("actions", [])][:3],
        "evac_h": data.get("evac_h"),
    }


def call_nemotron(lake_id: str, lake: dict, s: dict, attach_image: bool, api_key: str) -> dict:
    text = compact_prompt(lake, s)
    content: list | str = text
    image_url = _image_data_url(lake_id) if attach_image else None
    if image_url:
        content = [{"type": "text", "text": text}, {"type": "image_url", "image_url": {"url": image_url}}]

    payload = {
        "model": MODEL,
        "messages": [{"role": "system", "content": SYSTEM_PROMPT}, {"role": "user", "content": content}],
        "max_tokens": MAX_OUT_TOKENS,
        "temperature": 0,
        # Nemotron 3 reasoning traces are the biggest token sink; disable them when the endpoint allows it.
        "chat_template_kwargs": {"enable_thinking": False},
    }
    started = time.perf_counter()
    try:
        data = _post(payload, api_key)
    except urllib.error.HTTPError as err:
        if err.code != 400:
            raise
        payload.pop("chat_template_kwargs")
        payload["messages"][0]["content"] = "/no_think " + SYSTEM_PROMPT
        data = _post(payload, api_key)
    latency_ms = int((time.perf_counter() - started) * 1000)

    usage = data.get("usage", {})
    parsed = _parse_json(data["choices"][0]["message"].get("content") or "")
    return {
        "result": parsed,
        "tokens_in": usage.get("prompt_tokens", 0),
        "tokens_out": usage.get("completion_tokens", 0),
        "latency_ms": latency_ms,
        "image_sent": bool(image_url),
    }


def _summary(lake_id: str, lake: dict) -> dict:
    s = lake["sensors"]
    return {
        "id": lake_id,
        **{k: lake[k] for k in ("name", "country", "region", "lat", "lon", "elev_m", "dam",
                                "downstream_pop", "first_village", "distance_km", "visual")},
        "image": f"/lakes/{lake_id}.png",
        "years": YEARS, "area_km2": lake["area_km2"],
        "growth_pct_yr": _growth_pct_per_year(lake["area_km2"]),
        "sensors": s,
        "baseline": heuristic(lake, s),
    }


@app.get("/api/py/health")
def health():
    return {"model": MODEL, "provider": "Nebius Token Factory", "live": bool(os.getenv("NEBIUS_API_KEY")),
            "price_in_per_m": PRICE_IN, "price_out_per_m": PRICE_OUT, "max_out_tokens": MAX_OUT_TOKENS,
            "session": _session}


@app.get("/api/py/lakes")
def list_lakes():
    return [_summary(lake_id, lake) for lake_id, lake in LAKES.items()]


@app.post("/api/py/lakes/{lake_id}/analyze")
def analyze(lake_id: str, body: AnalyzeRequest):
    lake = LAKES.get(lake_id)
    if not lake:
        raise HTTPException(404, "Unknown lake")
    s = _sensors(lake, body.scenario)
    prompt = compact_prompt(lake, s)
    key = hashlib.sha1(f"{MODEL}|{prompt}|{body.attach_image}".encode()).hexdigest()

    if key in _cache:
        _session["cache_hits"] += 1
        return {**_cache[key], "cached": True, "tokens_in": 0, "tokens_out": 0, "cost_usd": 0.0, "latency_ms": 0}

    api_key = os.getenv("NEBIUS_API_KEY")
    response = {"lake_id": lake_id, "scenario": body.scenario, "sensors": s, "prompt": prompt, "model": MODEL}

    if api_key:
        try:
            out = call_nemotron(lake_id, lake, s, body.attach_image, api_key)
            cost = (out["tokens_in"] * PRICE_IN + out["tokens_out"] * PRICE_OUT) / 1_000_000
            _session["calls"] += 1
            _session["tokens_in"] += out["tokens_in"]
            _session["tokens_out"] += out["tokens_out"]
            _session["cost_usd"] = round(_session["cost_usd"] + cost, 8)
            response.update(
                source="nemotron" if out["result"] else "heuristic-fallback",
                analysis=out["result"] or heuristic(lake, s),
                tokens_in=out["tokens_in"], tokens_out=out["tokens_out"],
                latency_ms=out["latency_ms"], cost_usd=round(cost, 8), image_sent=out["image_sent"],
            )
        except Exception as err:  # noqa: BLE001 - surface any upstream failure as a mock fallback
            response.update(source="heuristic-fallback", error=str(err)[:200], analysis=heuristic(lake, s),
                            tokens_in=0, tokens_out=0, latency_ms=0, cost_usd=0.0, image_sent=False)
    else:
        est_in = len(SYSTEM_PROMPT + prompt) // 4
        response.update(source="mock", analysis=heuristic(lake, s), tokens_in=est_in, tokens_out=70,
                        latency_ms=0, cost_usd=round((est_in * PRICE_IN + 70 * PRICE_OUT) / 1_000_000, 8),
                        image_sent=False, estimated=True)

    if response["source"] != "heuristic-fallback":
        _cache[key] = response
    return {**response, "cached": False}
