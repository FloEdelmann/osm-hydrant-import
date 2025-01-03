import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { XMLParser } from 'fast-xml-parser';
import { createObjectCsvWriter } from 'csv-writer';
import GeoJson from 'geojson';

const kmlFileName = new URL('./hydranten_ewk.kml', import.meta.url);
const csvFileName = new URL('./hydranten_ewk.csv', import.meta.url);
const geoJsonFileName = new URL('./hydranten_ewk.geojson', import.meta.url);

const kmlContent = await readFile(kmlFileName, 'utf-8');

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '$',
});
const document = xmlParser.parse(kmlContent).kml.Document;
const schema = /** @type {any[]} */ (document.Schema.SimpleField);
const features = /** @type {any[]} */ (document.Folder.Placemark);

const hydrantTypeMapping = {
  Unterflurhydrant: 'underground',
  Überflurhydrant: 'pillar',
};

function getCoordinates(feature) {
  assert(feature.Point, 'Hydrant has no point');
  assert(!Array.isArray(feature.Point), 'Multiple points found in a single hydrant');
  assert(feature.Point.coordinates, 'Hydrant point has no coordinates');

  const coordinatesRegexp = /^(\d+\.\d+),(\d+\.\d+)$/;
  assert.match(feature.Point.coordinates, coordinatesRegexp, 'Hydrant point coordinates invalid');
  const [, longitude, latitude] = coordinatesRegexp.exec(feature.Point.coordinates);

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

  const attributes = Object.fromEntries(
    simpleData.map((attribute) => [attribute.$name, attribute['#text']]),
  );

  assert.equal(attributes.STATUS, 'in Betrieb', 'Hydrant is not in use');

  return attributes;
}

function getOsmHydrantType(hydrant) {
  assert(hydrant.BAUART in hydrantTypeMapping, `Unknown hydrant type '${hydrant.BAUART}'`);
  return hydrantTypeMapping[hydrant.BAUART];
}

function getOsmStartDate(hydrant) {
  if (!hydrant.EINBAUJAHR) {
    return undefined;
  }

  const startDateRegexp = /^(\d{4})\/(\d{2})\/(\d{2})$/;
  assert.match(hydrant.EINBAUJAHR, startDateRegexp, 'Hydrant start date invalid');
  const [, year, month, date] = startDateRegexp.exec(hydrant.EINBAUJAHR);

  // ignore month and date because they are mostly January 1st, which seems implausible
  return year;
}

function getOsmDiameter(hydrant) {
  const diameters = [
    hydrant.NENNWEITE1,
    hydrant.NENNWEITE2,
    hydrant.NENNWEITE3,
    hydrant.NENNWEITE4,
    hydrant.NENNWEITE5,
    hydrant.NENNWEITE6,
    hydrant.NENNWEITE7,
  ]
    .map((x) => Number.parseFloat(x))
    .filter((x) => !Number.isNaN(x))
    .filter((x) => x > 0);

  if (diameters.length === 0) {
    return undefined;
  }

  assert(
    diameters.some((x) => x % 5 === 0),
    'None of the diameters is cleanly divisible by 5',
  );

  const roundedTo5Diameters = diameters.map((x) => Math.round(x / 5) * 5);
  if (roundedTo5Diameters.some((x) => x !== roundedTo5Diameters[0])) {
    // not all diameters are equal after rounding to nearest 5, so let's discard them
    return undefined;
  }

  assert(roundedTo5Diameters[0] <= 200, `Diameter ${roundedTo5Diameters[0]} is bigger than 200`);
  return String(roundedTo5Diameters[0]);
}

const hydrants = features.map((feature) => ({
  ...getCoordinates(feature),
  ...getAttributes(feature),
}));

const osmHydrants = hydrants.map((hydrant) => ({
  latitude: hydrant.latitude,
  longitude: hydrant.longitude,
  emergency: 'fire_hydrant',
  'fire_hydrant:type': getOsmHydrantType(hydrant),
  'fire_hydrant:diameter': getOsmDiameter(hydrant),
  start_date: getOsmStartDate(hydrant),
}));

// console.log(schema);
// console.log(hydrants);

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
  console.log(`${csvFileName.pathname} written.`);
}

async function writeGeoJson() {
  const geoJsonContent = GeoJson.parse(osmHydrants, { Point: ['latitude', 'longitude'] });
  await writeFile(geoJsonFileName, JSON.stringify(geoJsonContent, undefined, 2), 'utf-8');
  console.log(`${geoJsonFileName.pathname} written.`);
}

await writeCsv();
await writeGeoJson();
