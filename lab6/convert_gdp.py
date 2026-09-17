"""Lab 6 — Convert flat GDP CSV to hierarchical JSON for D3 treemap."""

import pandas as pd
import json

df = pd.read_csv("../data/lab6_assignment_gdp.csv")

def build_hierarchy(dataframe, levels, value_col, extra_cols):
    """Recursively group by levels and build nested dict."""
    if len(levels) == 1:
        return [
            {
                "name": row[levels[0]],
                "value": row[value_col],
                **{col: row[col] for col in extra_cols}
            }
            for _, row in dataframe.iterrows()
        ]

    current = levels[0]
    children = []
    for value, group in dataframe.groupby(current):
        children.append({
            "name": value,
            "children": build_hierarchy(group, levels[1:], value_col, extra_cols)
        })
    return children

hierarchy = {
    "name": "World",
    "children": build_hierarchy(
        df,
        levels=["continent", "area", "country"],
        value_col="gdp_billion_usd",
        extra_cols=["gdp_status"]
    )
}

with open("../data/lab6_gdp_hierarchy.json", "w", encoding="utf-8") as f:
    json.dump(hierarchy, f, indent=2, ensure_ascii=False)

print("Saved lab6_gdp_hierarchy.json")
print(f"Countries: {len(df)}")
