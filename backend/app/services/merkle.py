from app.services.provenance_hashing import canonical_json, sha3_512_text


def build_merkle_root(hashes: list[str]) -> str:
    if not hashes:
        return sha3_512_text("")

    level = hashes[:]
    while len(level) > 1:
        if len(level) % 2:
            level.append(level[-1])
        level = [
            sha3_512_text(canonical_json({"left": level[i], "right": level[i + 1]}))
            for i in range(0, len(level), 2)
        ]
    return level[0]
