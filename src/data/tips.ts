export const allCategories = [
  { id: 'general', name: 'Algemeen', icon: 'spark', caption: 'Over alles. Goed voor vrijwel niets.' },
  { id: 'arc', name: 'Arc Raiders', icon: 'radar', caption: 'Grote robots. Kleine inzichten.' },
  { id: 'school', name: 'School', icon: 'pencil', caption: 'Dit komt gelukkig niet op de toets.' },
] as const;

// School remains stored for future use, but is not a playable category.
export const categories = allCategories.filter(category => category.id !== 'school');
export type StoredCategoryId = typeof allCategories[number]['id'];
export type CategoryId = typeof categories[number]['id'];
export interface Tip { id: string; category: CategoryId; text: string }

// IDs stay attached to their text. Add new IDs; never renumber existing tips.
const content: Record<StoredCategoryId, readonly (readonly [string, string])[]> = {
  arc: [
    ['arc-001', 'Een Shredder is een combinatie tussen een prullenbak en een stofzuiger.'],
    ['arc-002', 'Als je geen kogels meer hebt, kun je altijd nog pew pew roepen.'],
    ['arc-003', 'Loot is gewoon rommel waar je ineens heel zuinig op bent.'],
    ['arc-004', 'Een lege rugzak is heel licht. Je team noemt dat geen succes.'],
    ['arc-005', 'De beste verstopplek is meestal niet midden op het plein.'],
    ['arc-006', 'Een robot heeft ook gevoelens. Waarschijnlijk vooral piep.'],
    ['arc-007', 'Speranza: de enige plek waar je rugzak even kan bijkomen.'],
    ['arc-008', 'Als je een Wasp hoort zoemen, is dat geen elektrische tandenborstel.'],
    ['arc-009', 'Een extractie is een heel ingewikkelde manier om naar huis te gaan.'],
    ['arc-010', 'Je kunt een ARC niet aaien. Hij beoordeelt je hand als loot.'],
    ['arc-011', 'Een kapot apparaat heet boven de grond ineens een waardevolle vondst.'],
    ['arc-012', 'Samen sluipen gaat beter als niemand roept: WIJ ZIJN AAN HET SLUIPEN.'],
    ['arc-013', 'Je inventaris is vol. Tijd om afscheid te nemen van je zevende onmisbare schroef.'],
    ['arc-014', 'Een schild is een paraplu met een veel moeilijkere baan.'],
    ['arc-015', 'Van ver weg lijkt een grote robot kleiner. Dat is helaas geen strategie.'],
    ['arc-016', 'Een Hornet heeft geen honing bij zich. Slechte bij.'],
    ['arc-017', 'Als je teamgenoot zegt dat het veilig is, bedoelt hij meestal: ik sta er nog.'],
    ['arc-018', 'Je hebt de uitgang gevonden. Nu nog de moed om je loot achter te laten.'],
    ['arc-019', 'Een werkbank is een tafel die wél weet wat hij aan het doen is.'],
    ['arc-020', 'Loot sorteren telt als avontuur als je er spannende muziek bij maakt.'],
  ],
  school: [
    ['school-001', 'Een gum is een potlood met spijt.'],
    ['school-002', 'Je schrift is een boek waarvan de schrijver nog huiswerk heeft.'],
    ['school-003', 'Een liniaal is een stok die overal een cijfer aan geeft.'],
    ['school-004', 'De bel is het enige instrument waarvoor de hele klas meteen opstaat.'],
    ['school-005', 'Een leeg antwoord is heel netjes gespeld.'],
    ['school-006', 'Een broodtrommel is een garage voor boterhammen.'],
    ['school-007', 'Als je je naam vergeet, is je toets ineens een mysterieboek.'],
    ['school-008', 'Een puntenslijper maakt van je potlood een kleiner probleem.'],
    ['school-009', 'De tafel van één heeft verrassend weinig verrassingen.'],
    ['school-010', 'Een rugzak is een kast die mee moet naar gym.'],
    ['school-011', 'Op een wereldkaart staat de hele wereld, behalve waar je gum is.'],
    ['school-012', 'Een komma is een punt die nog niet klaar is.'],
    ['school-013', 'Tijdens stil lezen maakt vooral je hoofd veel lawaai.'],
    ['school-014', 'Je huiswerk is thuis. Technisch gezien klopt de naam.'],
    ['school-015', 'Een geodriehoek is een liniaal die heel belangrijk doet.'],
    ['school-016', 'Als je heel langzaam schrijft, is de les niet automatisch langer.'],
    ['school-017', 'Een dictee is verstoppertje voor letters.'],
    ['school-018', 'De achterkant van je blaadje is gratis extra voorkant.'],
    ['school-019', 'Een schoolbord weet elke dag alles en is het daarna weer kwijt.'],
    ['school-020', 'Een tien is een één met gezelschap.'],
  ],
  general: [
    ['general-001', 'Rood is een andere kleur dan blauw.'],
    ['general-002', 'Een deur is eigenlijk een muur die van gedachten kan veranderen.'],
    ['general-003', 'Een trap is een ladder die het rustig aan doet.'],
    ['general-004', 'Een koelkast is eigenlijk een kast met winter erin.'],
    ['general-005', 'Als je je ogen dichtdoet, zie je aanzienlijk minder.'],
    ['general-006', 'Een sok is een slaapzak voor precies één voet.'],
    ['general-007', 'Een spiegel kopieert alles en krijgt daar nooit straf voor.'],
    ['general-008', 'De onderkant van je pizza is ook pizza. Graag gedaan.'],
    ['general-009', 'Een wolk is mist die hogerop wil.'],
    ['general-010', 'Een lepel is een piepklein soepzwembad.'],
    ['general-011', 'Links is rechts als je net de andere kant op staat.'],
    ['general-012', 'Een stoel heeft vier poten en gaat helemaal nergens heen.'],
    ['general-013', 'Je schaduw werkt gratis, maar neemt vrij als het donker wordt.'],
    ['general-014', 'Een banaan heeft zijn eigen verpakking. Erg professioneel.'],
    ['general-015', 'Wie niets kwijt is, kan heel snel stoppen met zoeken.'],
    ['general-016', 'Een paraplu is een dak met een handvat.'],
    ['general-017', 'Gisteren was vandaag nog morgen. Succes ermee.'],
    ['general-018', 'Een wekker is een doosje dat ruzie met je slaap maakt.'],
    ['general-019', 'Water is nat, ook als je het heel zelfverzekerd droog noemt.'],
    ['general-020', 'Een afstandsbediening ligt altijd ergens. Dat scheelt zoeken.'],
  ],
};

// Persistence recognizes inactive tips too, preserving existing School ratings/history.
export const allTips = Object.entries(content).flatMap(([category, items]) =>
  items.map(([id, text]) => ({ id, category: category as StoredCategoryId, text })),
);
export const tips: Tip[] = categories.flatMap(category =>
  content[category.id].map(([id, text]) => ({ id, category: category.id, text })),
);
