#!/usr/bin/env python3

import pandas as pd

print("Processing data...")
df = pd.read_csv("./product_list_sno.csv")

brand_list = df[["Brand"]].drop_duplicates()
brand_origin_list = df[["Brand", "Origin"]].drop_duplicates()

category_list = df[["Category"]].drop_duplicates()

product_list = df[["Product Name", "id", "Brand", "Origin", "Category", "Packaging"]]

#category_list.to_csv("./category.csv")
brand_list.to_csv("./brand_list.csv")
brand_origin_list.to_csv("./brand_origin_list.csv")

print("Done")
