### repository for: a pervasive but uneven loss of global natural forests under multi-risk exposures
this repository contains the replication code and source data for the paper:
**"a pervasive but uneven loss of global natural forests under multi-risk exposures"**.

### project structure
```
.
├── code/                   
│   ├── README.md
│   ├── test_compositing_strategies.js
│   ├── export_canopy_data.js
│   ├── export_natural_forest_extent.js
│   ├── calculate_natural_forest_area.js
│   ├── export_forest_loss_extent.js
│   ├── calculate_forest_loss_area.js
│   ├── export_risk_factors_extent.js
│   ├── calculate_risk_factors_area.js
│   ├── estimate_loss_proportion.js
│   ├── calculate_factor_coverage.js
│   ├── export_stable_forest_extent.js
│   ├── estimate_biomass_baseline.js
│   ├── estimate_loss_consequences.js
│   └── estimate_factor_consequences.js
├── data/
│   ├── README.md
│   └── sample_data.zip
├── LICENSE
└── README.md
```

### reproduction note
all files archived in "data/sample_data.zip" can be fully reproduced by executing the data acquisition scripts provided in the "code/" directory.

### software dependencies
a valid GEE user account, no local dependencies need to be installed.

### instructions to run
after loading a script in the code editor, click the "run" button to execute the analysis, some scripts may require the user to modify output paths or parameters according to comments within the code.

### expected output
the output of the scripts are chunked geospatial vector files or raster datasets containing statistics such as forest loss area (in million hectares) or AGB loss (in Mg), aggregated by grid cells.

### expected run time
on the GEE platform, the specific run time depends on the platform's current resource allocation, typically ranging from a few minutes to several tens of minutes.
