# osm-hydrant-import

Tools for importing the fire hydrants provided by OSM user _KS-Brandschutz_ in [this OSM community forum thread](https://community.openstreetmap.org/t/hydranten-hinzufugen/123792) into OpenStreetMap.

> [!WARNING]  
> This is a work in progress and not yet ready for use.

## Usage

Make sure you have a recent version of Node.js installed. Then run the following commands:

```sh
npm install
npm run convert
```

This will read the KML file and generate a CSV file (to make all available features easy to read) and a GeoJSON file that can be imported into OpenStreetMap.
