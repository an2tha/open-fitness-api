import {
  equipmentTable,
  exerciseEquipmentTable,
  exerciseMusclesTable,
  exercisesTable,
  musclesTable,
} from '@repo/db/src/schema';
import { $ } from 'bun';
import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/bun-sql';
import { getLogger } from '../utils/logger';

config({ path: new URL('../../../.env', import.meta.url).pathname, quiet: true });

const DATABASE_URL = process.env.DATABASE_URL;

type ExerciseJson = {
  name: string;
  equipment: string | null;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
};

const downloadZip = (url: string, path: string, id: string) => {
  const logger = getLogger();
  return Bun.file(path).exists().then(exists => {
    if (exists) return;
    logger.setProgress(id, 0, 0, `downloading ${id}`);
    return fetch(url).then(res => {
      if (!res.ok) throw new Error(`Download failed: ${res.status}`);
      const total = Number(res.headers.get('content-length') ?? 0);
      const reader = res.body?.getReader();
      if (!reader) throw new Error('No body');
      const writer = Bun.file(path).writer();
      let downloaded = 0;
      const pump = (): Promise<void> =>
        reader.read().then(({ done, value }) => {
          if (done) { writer.end(); return; }
          writer.write(value);
          downloaded += value.byteLength;
          logger.setProgress(id, downloaded, total, `downloading ${id}`);
          return pump();
        });
      return pump();
    });
  });
};

const insertExercises = async (id: string, json: ExerciseJson[]) => {
  if (!DATABASE_URL) throw new Error('DATABASE_URL is required');
  const logger = getLogger();
  const sqlClient = new Bun.SQL(DATABASE_URL);
  const db = drizzle(sqlClient);

  const muscles = new Set<string>();
  const equipment = new Set<string>();
  json.forEach(e => {
    e.primaryMuscles.forEach(m => muscles.add(m));
    e.secondaryMuscles.forEach(m => muscles.add(m));
    if (e.equipment) equipment.add(e.equipment);
  });

  logger.info(`[${id}] syncing muscles and equipment...`);
  await db.insert(musclesTable).values(Array.from(muscles).map(name => ({ name }))).onConflictDoNothing();
  await db.insert(equipmentTable).values(Array.from(equipment).map(name => ({ name }))).onConflictDoNothing();

  const dbMuscles = await db.select().from(musclesTable);
  const dbEquipment = await db.select().from(equipmentTable);
  const muscleMap = new Map(dbMuscles.map(m => [m.name, m.id]));
  const equipMap = new Map(dbEquipment.map(e => [e.name, e.id]));

  logger.setProgress(id, 0, json.length, `loading ${id}`);
  for (let i = 0; i < json.length; i++) {
    const e = json[i]!;
    const [inserted] = await db.insert(exercisesTable).values({
      name: e.name,
      description: e.instructions.join('\n').slice(0, 2056),
    }).onConflictDoNothing().returning({ id: exercisesTable.id });

    if (inserted) {
      const links: any[] = [];
      e.primaryMuscles.forEach(m => {
        const mid = muscleMap.get(m);
        if (mid) links.push(db.insert(exerciseMusclesTable).values({ exerciseId: inserted.id, muscleId: mid, role: 'primary' }).onConflictDoNothing());
      });
      e.secondaryMuscles.forEach(m => {
        const mid = muscleMap.get(m);
        if (mid) links.push(db.insert(exerciseMusclesTable).values({ exerciseId: inserted.id, muscleId: mid, role: 'secondary' }).onConflictDoNothing());
      });
      if (e.equipment) {
        const eid = equipMap.get(e.equipment);
        if (eid) links.push(db.insert(exerciseEquipmentTable).values({ exerciseId: inserted.id, equipmentId: eid }).onConflictDoNothing());
      }
      await Promise.all(links);
    }
    if (i % 50 === 0) logger.setProgress(id, i, json.length, `loading ${id}`);
  }

  await sqlClient.close();
  logger.setProgress(id, json.length, json.length, `loaded ${id}`);
};

export const loadYuhonasExercises = async () => {
  const ID = 'yuhonas';
  const ZIP_PATH = '/tmp/exercises-yuhonas.zip';
  const URL = 'https://github.com/yuhonas/free-exercise-db/archive/refs/heads/main.zip';
  const JSON_PATH = 'free-exercise-db-main/dist/exercises.json';

  await downloadZip(URL, ZIP_PATH, ID);
  const proc = Bun.spawn(['unzip', '-p', ZIP_PATH, JSON_PATH]);
  const json = await new Response(proc.stdout).json() as ExerciseJson[];
  return insertExercises(ID, json);
};

export const loadWrkoutExercises = async () => {
  const ID = 'wrkout';
  const ZIP_PATH = '/tmp/exercises-wrkout.zip';
  const URL = 'https://github.com/wrkout/exercises.json/archive/refs/heads/master.zip';
  const EXTRACT_PATH = '/tmp/exercises-wrkout-tmp';

  await downloadZip(URL, ZIP_PATH, ID);
  await $`rm -rf ${EXTRACT_PATH} && mkdir -p ${EXTRACT_PATH}`.quiet();
  await $`unzip -oq ${ZIP_PATH} -d ${EXTRACT_PATH}`.quiet();

  const glob = new Bun.Glob(`${EXTRACT_PATH}/**/exercise.json`);
  const files = Array.from(glob.scanSync());
  const json: ExerciseJson[] = [];

  for (const file of files) {
    json.push(await Bun.file(file).json());
  }

  return insertExercises(ID, json);
};
