# Repository overview

This repository contains the replication code and example data for the paper:
**"a pervasive but uneven loss of global natural forests under multi-risk exposures"**.

## Project structure
```
.
├── Code/                   
│   ├── 01_test_compositing_strategies
│   ├── 02_export_canopy_data
│   ├── 03_export_natural_forest_extent
│   ├── 04_calculate_natural_forest_area
│   ├── 05_export_forest_loss_extent
│   ├── 06_calculate_forest_loss_area
│   ├── 07_export_stable_forest_extent
│   ├── 08_estimate_biomass_baseline
│   ├── 09_export_risk_factors_extent
│   ├── 10_calculate_risk_factors_area
│   ├── 11_estimate_loss_proportion
│   ├── 12_calculate_factor_coverage
│   ├── 13_estimate_loss_consequences
│   ├── 14_estimate_factor_consequences
│   └── README.md
├── Data/
│   ├── example_data.zip
│   └── README.md
├── LICENSE
└── README.md
```

## Reproduction note
all files archived in "Data/example_data.zip" can be fully reproduced by executing the data acquisition scripts provided in the "Code/" directory.

## Software dependencies
a valid GEE user account, no local dependencies need to be installed.

## Instructions to run
after loading a script in the code editor, click the "run" button to execute the analysis, some scripts may require the user to modify output paths or parameters according to comments within the code.

## Expected output
the output of the scripts are chunked geospatial vector files or raster datasets containing statistics such as forest loss area (in million hectares) or AGB loss (in Mg), aggregated by grid cells.

## Expected run time
on the GEE platform, the specific run time depends on the platform's current resource allocation, typically ranging from a few minutes to several tens of minutes.
