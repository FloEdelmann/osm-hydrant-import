import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { XMLParser } from 'fast-xml-parser';
import { createObjectCsvWriter } from 'csv-writer';

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

function getAttributes(feature) {
  const simpleData = feature.ExtendedData?.SchemaData?.SimpleData;
  assert(simpleData, 'Hydrant has no attributes');

  for (const { $name: attributeName } of simpleData) {
    assert(attributeName, 'Hydrant attribute name is undefined');
    assert(
      schema.some((simpleField) => simpleField.$name === attributeName),
      `Hydrant has unknown attribute '${attributeName}'`,
    );
  }

  return Object.fromEntries(simpleData.map((attribute) => [attribute.$name, attribute['#text']]));
}

const hydrants = features.map((feature) => ({
  ...getCoordinates(feature),
  ...getAttributes(feature),
}));

console.log(schema);
console.log(hydrants);

async function writeCsv() {
  const csvWriter = createObjectCsvWriter({
    path: csvFileName.pathname,
    header: [
      { id: 'latitude', title: 'latitude' },
      { id: 'longitude', title: 'longitude' },
      ...schema.map((field) => ({
        id: field.$name,
        title: `${field.$name} (${field.$type})`,
      })),
    ],
  });

  await csvWriter.writeRecords(hydrants);
}

await writeCsv();
