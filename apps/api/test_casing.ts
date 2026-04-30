import { toFriendlyCase } from './src/lib/utils';

const tests = [
  'MIXED FRUIT MEDLEY FRESHLY FROZEN STRAWBERRIES',
  'APPLE',
  'Banana', // Should stay as is
  '100% ORANGE JUICE',
  'USDA DATA',
  'Mixed Case Item', // Should stay as is
];

tests.forEach((t) => {
  console.log(`"${t}" -> "${toFriendlyCase(t)}"`);
});
