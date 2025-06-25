import re
import json

from processed_labels import PROCESSED_LABELS

VALID_PREPOSITIONS = [
    "in", "on", "with", "blocking", "at",
    "to", "into", "onto", "over", "under", "through"
]

def singularize(phrase: str) -> str:
    parts = phrase.split()
    if not parts:
        return phrase
    last = parts[-1].lower()
    if last.endswith("ies") and len(last) > 3:
        last = last[:-3] + "y"
    elif last.endswith(("ss", "us", "is")):
        last = last
    elif last.endswith("s"):
        last = last[:-1]
    parts[-1] = last
    return " ".join(parts)

def extract_objects(text: str) -> list[dict]:
    results = []
    for chunk in re.findall(r'\((.*?)\)', text):
        adjs = re.findall(r'<([^>]+)>', chunk)
        raw_objs = re.findall(r'\[([^\]]+)\]', chunk)
        for raw in raw_objs:
            variants = []
            if '/' in raw and raw.count('/') == 1 and adjs:
                prefix, suffix = raw.split('/', 1)
                variants.append(prefix.strip())
                head = prefix.rsplit(' ', 1)[0]
                variants.append(f"{head} {suffix.strip()}")
            else:
                variants.extend([v.strip() for v in raw.split('/')])
            for obj in variants:
                if adjs:
                    for adj in adjs:
                        results.append({"adjective": adj.lower(), "object": obj.lower()})
                else:
                    results.append({"adjective": "", "object": obj.lower()})
    return results

def parse_label(label: str) -> dict:
    m = re.search(r'\b(' + '|'.join(VALID_PREPOSITIONS) + r')\b', label)
    if m:
        prep = m.group(1)
        start, end = m.span()
        primary_part = label[:start].strip()
        secondary_part = label[end:].strip()
    else:
        prep = ""
        primary_part, secondary_part = label, ""
    primary_objs = extract_objects(primary_part)
    secondary_objs = extract_objects(secondary_part)
    base_objs = {singularize(item["object"]) for item in primary_objs + secondary_objs}
    return {
        "preposition": prep,
        "primary_objects": primary_objs,
        "secondary_objects": secondary_objs,
        "base_objects": sorted(base_objs)
    }

if __name__ == "__main__":
    parsed_results = [parse_label(lbl) for lbl in PROCESSED_LABELS]

    # Write the full parsed labels to parsed_labels.json
    with open("parsed_labels.json", "w", encoding="utf-8") as f:
        json.dump(parsed_results, f, indent=2, ensure_ascii=False)

    # Compute distinct base objects
    distinct_base = sorted({
        obj for entry in parsed_results for obj in entry["base_objects"]
    })

    # Write them to distinct_base_objects.json
    with open("distinct_base_objects.json", "w", encoding="utf-8") as f:
        json.dump(distinct_base, f, indent=2, ensure_ascii=False)

    print("Wrote parsed_labels.json and distinct_base_objects.json")