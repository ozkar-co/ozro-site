import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const assetsPath = process.env.ASSETS_PATH
    ? path.resolve(process.env.ASSETS_PATH)
    : path.resolve(__dirname, '../../../assets');

let catalogPromise = null;

export async function loadCardCatalogServer() {
    if (!catalogPromise) {
        catalogPromise = readFile(path.join(assetsPath, 'cards/catalog.json'), 'utf8')
            .then((content) => JSON.parse(content))
            .catch((error) => {
                catalogPromise = null;
                throw error;
            });
    }
    return catalogPromise;
}

export async function getCardCatalogIndex() {
    const catalog = await loadCardCatalogServer();
    const categoryIds = (code) => new Set(
        catalog.categories
            .filter((category) => category.code === code)
            .flatMap((category) => category.cards.map((card) => card.id))
    );

    return {
        total: catalog.total,
        allIds: new Set(
            catalog.categories.flatMap((category) => category.cards.map((card) => card.id))
        ),
        bossIds: categoryIds('BOSS'),
        mvpIds: categoryIds('MVP')
    };
}
