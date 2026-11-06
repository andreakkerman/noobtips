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

// Content refresh: ratings and seen-history can start fresh.
const content: Record<StoredCategoryId, readonly (readonly [string, string])[]> = {
  arc: [
    ['arc-001', 'Een Shredder is een combinatie tussen een prullenbak en een stofzuiger.'],
    ['arc-002', 'Als je geen kogels meer hebt, kun je altijd nog pew pew roepen.'],
    ['arc-003', 'Als een Leaper springt, is hij even niet op de grond.'],
    ['arc-004', 'Een Raider Hatch Key is een sleutel voor een Raider Hatch.'],
    ['arc-005', 'Als je rugzak leeg is, zit er geen loot in.'],
    ['arc-006', 'Als een Wasp vliegt, loopt hij niet.'],
    ['arc-007', 'Wil je geen loot kwijtraken? Neem dan niks mee.'],
    ['arc-008', 'Als de lift weg is, kun je er niet meer in.'],
    ['arc-009', 'Een Rocketeer heeft raketten. Daarom heet hij Rocketeer.'],
    ['arc-010', 'Een Hornet past niet in je broodtrommel.'],
    ['arc-011', 'Een Bastion is groter dan een boterham.'],
    ['arc-012', 'Als je achter een muur staat, staat die muur voor je.'],
    ['arc-013', 'Een kapotte robot doet het meestal minder goed.'],
    ['arc-014', 'Als je een ARC van dichtbij wilt zien, moet je dichterbij komen.'],
    ['arc-015', 'Loot op de grond zit nog niet in je rugzak.'],
    ['arc-016', 'Als je teamgenoot naast je staat, is hij niet ver weg.'],
    ['arc-017', 'Als je op een dak staat, ben je hoger dan op de grond.'],
    ['arc-018', 'Als je je wapen laat vallen, heb je het niet meer vast.'],
    ['arc-019', 'Wil je niet gezien worden? Roep dan niet: IK BEN HIER!'],
    ['arc-020', 'Een volle rugzak is minder leeg dan een lege rugzak.'],
    ['arc-021', 'Een Safe Pocket helpt vooral als je er iets in stopt.'],
    ['arc-022', 'Als een Snitch andere robots roept, komen er meer robots.'],
    ['arc-023', 'Een Tick op je hoofd is geen helm.'],
    ['arc-024', 'Als een Rocketeer op je schiet, is stilstaan misschien geen topidee.'],
    ['arc-025', 'Een Wasp boven je hoofd zie je makkelijker als je omhoog kijkt.'],
    ['arc-026', 'Een lege lootkist kun je niet nóg een keer leeghalen.'],
    ['arc-027', 'Hoe meer loot je verzamelt, hoe meer loot je kunt kwijtraken.'],
    ['arc-028', 'Een schild dat je thuislaat, beschermt je niet tijdens je potje.'],
    ['arc-029', 'Achter een klein steentje kun je je minder goed verstoppen voor een Bastion.'],
    ['arc-030', 'Als je teamgenoot ver weg is, duurt het langer voor hij bij je is.'],
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
    ['general-002', 'Een deur kun je van twee kanten openen.'],
    ['general-003', 'Als je iets laat vallen, ligt het daarna meestal lager.'],
    ['general-004', 'Als je je ogen dichtdoet, zie je minder.'],
    ['general-005', 'De onderkant van je pizza is ook pizza. Graag gedaan.'],
    ['general-006', 'Wil je weten of het regent? Kijk of het regent.'],
    ['general-007', 'In een lege doos zit meestal niks.'],
    ['general-008', 'Als je niks opschrijft, maak je ook geen spelfouten.'],
    ['general-009', 'Als je huiswerk thuis ligt, ligt het niet op school.'],
    ['general-010', 'Een natte handdoek is minder droog dan een droge.'],
    ['general-011', 'Als je een boek dichtdoet, is het niet meer open.'],
    ['general-012', 'Een banaan zonder schil heeft geen schil.'],
    ['general-013', 'Als je een broodje doormidden snijdt, heb je twee stukken.'],
    ['general-014', 'Een wekker die niet afgaat, maakt geen wekkergeluid.'],
    ['general-015', 'Als je op een stoel zit, zit je niet naast die stoel.'],
    ['general-016', 'De bovenste trede van een trap zit bovenaan.'],
    ['general-017', 'Als je iets gevonden hebt, hoef je het niet meer te zoeken.'],
    ['general-018', 'Een lege broodtrommel heeft geen brood meer.'],
    ['general-019', 'Als je niet weet waar je bent, ben je in ieder geval ergens.'],
    ['general-020', 'Als je je blaadje omdraait, zit de achterkant voor.'],
    ['general-021', 'Een paraplu werkt beter als je hem openklapt.'],
    ['general-022', 'Als je te laat opstaat, heb je minder tijd om op tijd te komen.'],
    ['general-023', 'Een lege fles wordt niet voller als je ernaar kijkt.'],
    ['general-024', 'Een fiets zonder wielen is lastig om op te fietsen.'],
    ['general-025', 'Als je de lamp uitdoet, wordt het meestal donkerder.'],
    ['general-026', 'Een boterham die je hebt opgegeten, kun je niet nog een keer opeten.'],
    ['general-027', 'Een sleutel helpt weinig als je bij de verkeerde deur staat.'],
    ['general-028', 'Een broodrooster zonder brood roostert geen brood.'],
    ['general-029', 'Als je een koekje in tweeën breekt, heb je niet ineens twee koekjes.'],
    ['general-030', 'Als je iets op de grond legt, hoef je het niet meer vast te houden.'],
  ],
};

// All tips include the hidden School collection; only active categories are playable.
export const allTips = Object.entries(content).flatMap(([category, items]) =>
  items.map(([id, text]) => ({ id, category: category as StoredCategoryId, text })),
);

export const tips: Tip[] = categories.flatMap(category =>
  content[category.id].map(([id, text]) => ({ id, category: category.id, text })),
);
