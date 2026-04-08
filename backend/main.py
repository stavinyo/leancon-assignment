from flask import Flask, jsonify, send_from_directory, request
from flask_cors import CORS
import ifcopenshell
import ifcopenshell.util.element
import os

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
IFC_DIR  = os.path.abspath(os.path.join(BASE_DIR, "..", "ifc-files"))

_VOLUME_KEYS = {"NetVolume", "Volume"}
_AREA_KEYS   = {"NetArea",   "Area"}
_LENGTH_KEYS = {"Length"}

def _extract_quantity(psets):
    volume = area = length = None
    for pset in psets.values():
        if not isinstance(pset, dict):
            continue
        for key, raw in pset.items():
            try:
                v = float(raw)
            except (TypeError, ValueError):
                continue
            if volume is None and key in _VOLUME_KEYS:
                volume = v
            if area is None and key in _AREA_KEYS:
                area = v
            if length is None and key in _LENGTH_KEYS:
                length = v
        if volume is not None:
            break
            
    if volume is not None:
        return round(volume, 2), "m³"
    if area is not None:
        return round(area, 2), "m²"
    if length is not None:
        if length > 100:
            length /= 1000
        return round(length, 2), "m"
    return 1.0, "pcs"

def _nonempty(value):
    if isinstance(value, str) and value.strip():
        return value.strip()
    return None

def _resolve_type(product, psets):
    family_and_type = (psets.get("Other") or {}).get("Family and Type")
    return (
        _nonempty(family_and_type)
        or _nonempty(getattr(product, "ObjectType", None))
        or product.is_a()
    )


def get_model(filename):
    path = os.path.join(IFC_DIR, filename)
    if not os.path.exists(path):
        return None
    return ifcopenshell.open(path)

def get_ifc_files():
    return sorted([f for f in os.listdir(IFC_DIR) if f.endswith('.ifc')])

@app.route('/api/files')
def list_files():
    return jsonify(get_ifc_files())

@app.route('/api/model-data')
def get_model_data():
    try:
        all_level_names = []
        combined_map    = {}

        for filename in get_ifc_files():
            ifc_model = get_model(filename)
            if not ifc_model:
                continue

            levels = sorted(
                ifc_model.by_type("IfcBuildingStorey"),
                key=lambda s: s.Elevation if s.Elevation is not None else 0
            )
            for lvl in levels:
                if lvl.Name not in all_level_names:
                    all_level_names.append(lvl.Name)

            for product in ifc_model.by_type("IfcProduct"):
                if product.is_a("IfcSpatialElement") or product.is_a("IfcOpeningElement"):
                    continue

                psets     = ifcopenshell.util.element.get_psets(product)
                el_type   = _resolve_type(product, psets)
                container = ifcopenshell.util.element.get_container(product)
                lvl_name  = container.Name if container else "Unknown"
                val, unit = _extract_quantity(psets)

                if el_type not in combined_map:
                    combined_map[el_type] = {
                        "type":         el_type,
                        "unit":         unit,
                        "total":        0,
                        "levels":       {ln: 0  for ln in all_level_names},
                        "guidsByLevel": {ln: [] for ln in all_level_names},
                    }

                row = combined_map[el_type]
                row["total"] += val

                if lvl_name in row["levels"]:
                    row["levels"][lvl_name]      += val
                    row["guidsByLevel"][lvl_name].append(product.GlobalId)

        for row in combined_map.values():
            row["total"] = round(row["total"], 2)
            for ln in row["levels"]:
                row["levels"][ln] = round(row["levels"][ln], 2)

        sorted_rows = sorted(combined_map.values(), key=lambda r: r["type"].lower())
        return jsonify({"levels": all_level_names, "rows": sorted_rows})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/get-ifc')
def serve_ifc():
    filename = request.args.get('file')
    if not filename or not filename.endswith('.ifc') or '..' in filename or '/' in filename:
        return jsonify({"error": "Invalid filename"}), 400
    return send_from_directory(IFC_DIR, filename)

if __name__ == '__main__':
    app.run(debug=True, port=5001)