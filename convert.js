import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { XMLParser } from 'fast-xml-parser';

const kmlFileName = new URL('./hydranten_ewk.kml', import.meta.url);
const csvFileName = new URL('./hydranten_ewk.csv', import.meta.url);
const geojsonFileName = new URL('./hydranten_ewk.geojson', import.meta.url);

const kmlContent = await readFile(kmlFileName, 'utf-8');

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '$',
});
const document = xmlParser.parse(kmlContent).kml.Document;
const schema = document.Schema.SimpleField;
const features = document.Folder.Placemark;

function getCoordinates(feature) {
  assert(feature.Point, 'Hydrant has no point');
  assert(!Array.isArray(feature.Point), 'Multiple points found in a single hydrant');
  assert(feature.Point.coordinates, 'Hydrant point has no coordinates');

  const coordinatesRegexp = /^(\d+\.\d+),(\d+\.\d+)$/;
  assert.match(feature.Point.coordinates, coordinatesRegexp, 'Hydrant point coordinates invalid');
  const [, latitude, longitude] = coordinatesRegexp.exec(feature.Point.coordinates);

  return { latitude, longitude };
}

const hydrants = features.map((feature) => ({
  ...getCoordinates(feature),
  ...Object.fromEntries(
    feature.ExtendedData.SchemaData.SimpleData.map((simpleData) => [
      simpleData.$name,
      simpleData['#text'],
    ]),
  ),
}));

console.log(schema);
console.log(hydrants);
