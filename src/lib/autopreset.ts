import { getCatalog, getLines, getTarget } from './catalog';
import { dotDiameterMm } from './dots';
import type { CatalogStar, TargetPreset } from './catalog';
import type { DotScale } from './dots';

/** Пресет объекта не задан вручную, а выводится из его же данных: какие звёзды
 *  образуют фигуру, как тесно они стоят и насколько различаются по яркости.
 *
 *  Ограничения — из ремесла, а не из вкуса: игла не кладёт точку тоньше
 *  MIN_DOT_MM, две точки ближе MIN_GAP_MM сливаются в одну при заживлении,
 *  а татуировка на предплечье редко бывает шире MAX_PATTERN_CM. */

/** Самая тонкая точка, которую имеет смысл колоть */
const MIN_DOT_MM = 0.35;
/** Просвет между краями соседних точек, мм */
const MIN_GAP_MM = 1.1;
/** Размер рисунка растёт с числом точек: четыре звезды читаются и в четыре
 *  сантиметра, два десятка требуют места. Пересчёт см = BASE + PER_STAR × N */
const BASE_CM = 2.8;
const PER_STAR_CM = 0.22;
/** Разумные поперечники рисунка, см — перебираем от меньшего к большему */
const MIN_PATTERN_CM = 3.5;
const MAX_PATTERN_CM = 9;
const PATTERN_STEP_CM = 0.5;
/** Доля самых тесных пар, которой разрешено нарушить просвет: тесная двойная
 *  (Мицар с Алькором, ε Лиры) не должна раздувать всю татуировку */
const TIGHT_SHARE = 0.15;
/** Сколько калибров хочется видеть мастеру */
const WANTED_CLASSES = 4;
const STEP_CHOICES = [0.1, 0.15, 0.2, 0.25, 0.3, 0.4, 0.5];

/** Запас по яркости за самой тусклой звездой фигуры: без него звезда,
 *  попавшая ровно на порог, пропадает из-за округления */
const MAG_MARGIN = 0.3;
/** Скоплению линии не нарисованы — берём столько звёзд, сколько принято
 *  видеть глазом; лишние всё равно не разойдутся по коже */
const CLUSTER_STARS = 16;

/** Звёзды, образующие узнаваемую фигуру: вершины линий плюс именованные */
export function figureStars(id: string): CatalogStar[] {
    const catalog = getCatalog(id);
    const linked = new Set(getLines(id).flat());
    const picked = catalog.filter((s, i) => linked.has(i) || s.name);
    if (picked.length >= 3) return picked;
    return catalog.slice(0, Math.min(CLUSTER_STARS, catalog.length));
}

interface Pair {
    dist: number;
    a: number;
    b: number;
}

/** Пары ближайших соседей, тангенс-единицы. Пара считается один раз: иначе
 *  тесная двойная даёт две одинаково тесные записи и перекашивает статистику */
function nearestPairs(stars: CatalogStar[]): Pair[] {
    const seen = new Set<string>();
    const pairs: Pair[] = [];
    stars.forEach((a, i) => {
        let best = Infinity;
        let at = -1;
        stars.forEach((b, j) => {
            if (i === j) return;
            const d = Math.hypot(a.u - b.u, a.v - b.v);
            if (d < best) {
                best = d;
                at = j;
            }
        });
        if (at < 0) return;
        const key = i < at ? `${i}:${at}` : `${at}:${i}`;
        if (seen.has(key)) return;
        seen.add(key);
        pairs.push({ dist: best, a: i, b: at });
    });
    return pairs;
}

/** Поперечник фигуры в тангенс-единицах — та же мера, что и в model.ts */
function figureRadiusTan(stars: CatalogStar[]): number {
    return stars.reduce((r, s) => Math.max(r, Math.hypot(s.u, s.v)), 0);
}

/** Диаметры точек при выбранной шкале — той же, что на отрисовке */
function diameters(stars: CatalogStar[], scale: DotScale): number[] {
    const brightest = Math.min(...stars.map(s => s.mag));
    return stars.map(s => dotDiameterMm(scale, s.mag, brightest));
}

/** Размеры точек для рисунка заданного поперечника: крупная татуировка терпит
 *  крупные точки, мелкая — нет */
function dotSizes(patternCm: number, spread: number) {
    const maxMm = Math.round(Math.min(2.6, Math.max(1.1, patternCm * 0.26)) * 20) / 20;
    const minMm = Math.round(Math.max(MIN_DOT_MM, Math.min(0.6, maxMm * 0.22)) * 20) / 20;
    // контраст подобран так, чтобы самая тусклая звезда фигуры пришлась
    // ровно на минимальный диаметр, а весь диапазон яркостей был использован
    const contrast =
        spread > 0.15
            ? Math.min(0.5, Math.max(0.15, Math.log10(maxMm / minMm) / (0.4 * spread)))
            : 0.3;
    return { maxMm, minMm, contrast: Math.round(contrast * 100) / 100 };
}

/** Помещаются ли точки на коже: считаем просвет между краями каждой пары
 *  ближайших соседей и разрешаем нарушить его только самым тесным парам */
function fits(mmPerTan: number, d: number[], pairs: Pair[]): boolean {
    const gaps = pairs
        .map(p => p.dist * mmPerTan - d[p.a] / 2 - d[p.b] / 2)
        .sort((x, y) => x - y);
    // самую тесную пару пропускаем всегда: у Дельфина это двойная γ, которую
    // не развести никаким размером, и без поблажки рисунок раздувался до предела
    const skip = Math.max(1, Math.round(gaps.length * TIGHT_SHARE));
    const critical = gaps[Math.min(gaps.length - 1, skip)];
    return critical >= MIN_GAP_MM;
}

/** Поперечник — в разумных пределах и кратно половине сантиметра */
function clampStep(cm: number): number {
    const stepped = Math.round(cm / PATTERN_STEP_CM) * PATTERN_STEP_CM;
    return Math.round(Math.min(MAX_PATTERN_CM, Math.max(MIN_PATTERN_CM, stepped)) * 10) / 10;
}

/** Шаг квантования, дающий примерно WANTED_CLASSES калибров */
function quantStep(maxMm: number, minMm: number): number {
    const wanted = (maxMm - minMm) / (WANTED_CLASSES - 1);
    return STEP_CHOICES.reduce((best, s) =>
        Math.abs(s - wanted) < Math.abs(best - wanted) ? s : best,
    );
}

const cache = new Map<string, TargetPreset>();

/** Пресет объекта, посчитанный по каталогу и линиям фигуры */
export function autoPreset(id: string): TargetPreset {
    const cached = cache.get(id);
    if (cached) return cached;

    const target = getTarget(id);
    const catalog = getCatalog(id);
    const hasLines = getLines(id).length > 0;
    const figure = figureStars(id);

    const faintest = figure.reduce((m, s) => Math.max(m, s.mag), 0);
    const brightest = figure.reduce((m, s) => Math.min(m, s.mag), 99);
    const magLimit = Math.min(
        target.fetchMagLimit,
        Math.round((faintest + MAG_MARGIN) * 20) / 20,
    );
    const spread = faintest - brightest;

    // сколько звёзд поля добавится к фигуре: пара соседей — фон, сотня — каша
    const inField = catalog.filter(s => s.mag <= magLimit).length;
    const extra = inField - figure.length;
    // у скопления фигуры нет — делить поле не на что
    const backgroundStars = !hasLines || extra <= 2 ? 'show' : extra <= 25 ? 'fade' : 'hide';

    // размер — от числа звёзд самой фигуры: приглушённое поле вокруг
    // на размер татуировки не влияет
    const radiusTan = figureRadiusTan(figure) || 1;
    const pairs = nearestPairs(figure);
    let patternCm = clampStep(BASE_CM + PER_STAR_CM * figure.length);

    // страховка: если самые тесные пары всё же сливаются, рисунок растёт
    let sizes = dotSizes(patternCm, spread);
    while (patternCm < MAX_PATTERN_CM) {
        const mmPerTan = (patternCm * 10) / (2 * radiusTan);
        const d = diameters(figure, sizes);
        if (fits(mmPerTan, d, pairs)) break;
        patternCm = Math.round((patternCm + PATTERN_STEP_CM) * 10) / 10;
        sizes = dotSizes(patternCm, spread);
    }

    const named = figure.filter(s => s.name).length;

    const preset: TargetPreset = {
        magLimit,
        patternCm,
        maxMm: sizes.maxMm,
        minMm: sizes.minMm,
        contrast: sizes.contrast,
        stepMm: quantStep(sizes.maxMm, sizes.minMm),
        quantize: true,
        showLines: hasLines,
        lineMm: Math.round(Math.min(0.45, Math.max(0.25, sizes.minMm * 0.8)) * 100) / 100,
        backgroundStars,
        // подписей столько, сколько именованных звёзд; десяток ещё читается
        labels: named <= 12 ? 'names' : 'none',
        ...target.preset,
    };

    cache.set(id, preset);
    return preset;
}
