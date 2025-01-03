# osm-hydrant-import

Tools for importing the fire hydrants provided by OSM user _KS-Brandschutz_ in [this OSM community forum thread](https://community.openstreetmap.org/t/hydranten-hinzufugen/123792) into OpenStreetMap.

## Usage

Make sure you have a recent version of Node.js installed. Then run the following commands:

```sh
npm install
npm run convert
```

This will read the KML file and generate several other files:

| File name             | Open with                       | Description                                                                         |
| --------------------- | ------------------------------- | ----------------------------------------------------------------------------------- |
| [`hydranten_ewk.kml`] |                                 | input data                                                                          |
| [`raw-data.csv`]      | Excel / LibreOffice Calc / etc. | data from the KML file with minimal processing, for manual analysis of the raw data |
| [`osm-data.geojson`]  | [JOSM]                          | processed and cleaned up data, for importing into OpenStreetMap                     |
| [`osm-data.csv`]      | Excel / LibreOffice Calc / etc. | processed and cleaned up data, for manual analysis of the processed data            |

[`hydranten_ewk.kml`]: data/hydranten_ewk.kml
[`raw-data.csv`]: data/raw-data.csv
[`osm-data.geojson`]: data/osm-data.geojson
[`osm-data.csv`]: data/osm-data.csv
[JOSM]: https://wiki.openstreetmap.org/wiki/JOSM

## License

Code: MIT License  
Data: ODbL, according to <https://community.openstreetmap.org/t/hydranten-hinzufugen/123792/13>
