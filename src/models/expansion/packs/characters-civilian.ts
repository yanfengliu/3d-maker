import type { ProceduralAssetDef } from '../../collection-types';
import { charactersCivilianMeta, type ExpansionMetaItem } from '../meta/characters-civilian';
import { charAsset, det, rig } from './characters-civilian-kit';
import {
  buildAlpineMountaineer, buildArchivistLibrarian, buildCommercialAirlinePilot, buildFieldBotanist,
  buildHospitalSurgeon, buildJazzSaxophonist, buildNoirTrenchDetective, buildPostalCarrier,
  buildCafeBarista, buildVillageBlacksmith,
} from './characters-civilian-a';
import {
  buildAstronomyProfessor, buildBicycleFlorist, buildDigArchaeologist, buildHarvestFarmer,
  buildKimonoSilkWeaver, buildMaritimeHarborCaptain, buildMasterCarpenter, buildRailwayConductor,
  buildStudioPainter, buildUrbanSkater,
} from './characters-civilian-b';

function metaAt(id: string): ExpansionMetaItem {
  const found = charactersCivilianMeta.find(item => item.id === id);
  if (!found) throw new Error('Missing characters-civilian meta: ' + id);
  return found;
}

export const charactersCivilianPack: readonly ProceduralAssetDef[] = [
  charAsset(metaAt('hospital-surgeon'),
    [rig('SurgicalLoupes', 'Surgical loupes', 'x', [0, -50], 'Flips up the optical surgical loupes and headlamp')],
    [det('DoctorSatchel', 'Medical satchel', 'Hip-slung clinic medical case with cross emblem')], buildHospitalSurgeon),
  charAsset(metaAt('commercial-airline-pilot'),
    [rig('CommsBoom', 'Comms boom', 'y', [-45, 35], 'Swivels the flight-deck headset microphone boom')],
    [det('CaptainCap', 'Captain cap', 'Peaked airline captain cap with gilded wings')], buildCommercialAirlinePilot),
  charAsset(metaAt('field-botanist'),
    [rig('SpecimenLens', 'Specimen lens', 'z', [-30, 45], 'Tilts the brass botanical hand magnifier')],
    [det('SafariHat', 'Safari hat', 'Wide-brimmed expedition pith sunhat')], buildFieldBotanist),
  charAsset(metaAt('village-blacksmith'),
    [rig('ForgeGoggles', 'Forge goggles', 'x', [0, -48], 'Raises the brass smithing goggles onto the forehead')],
    [det('ForgeToolRoll', 'Forge tool roll', 'Back-mounted leather roll of iron tongs and bars')], buildVillageBlacksmith),
  charAsset(metaAt('jazz-saxophonist'),
    [rig('SaxBell', 'Tenor saxophone', 'z', [-18, 18], 'Sways the brass tenor saxophone across the torso')],
    [det('JazzFedora', 'Jazz fedora', 'Tilted evening fedora with satin ribbon band')], buildJazzSaxophonist),
  charAsset(metaAt('cafe-barista'),
    [rig('PortafilterArm', 'Espresso portafilter', 'x', [-35, 35], 'Tilts the brass espresso portafilter basket')],
    [det('BaristaBeanie', 'Knit beanie', 'Cuffed wool barista beanie cap')], buildCafeBarista),
  charAsset(metaAt('postal-carrier'),
    [rig('MailFlap', 'Mailbag flap', 'x', [0, -68], 'Lifts the hinged postal satchel flap')],
    [det('PostalCap', 'Postal cap', 'Visored postal carrier uniform cap')], buildPostalCarrier),
  charAsset(metaAt('archivist-librarian'),
    [rig('LedgerCover', 'Ledger cover', 'y', [0, 65], 'Opens the front cover of the leather archival folio')],
    [det('ScrollSatchel', 'Scroll satchel', 'Hip satchel packed with rolled parchment scrolls')], buildArchivistLibrarian),
  charAsset(metaAt('alpine-mountaineer'),
    [rig('ClimbLamp', 'Helmet headlamp', 'x', [-40, 25], 'Tilts the alpine climbing helmet beam up and down')],
    [det('SummitPack', 'Summit rucksack', 'Tall alpine climbing pack with rolled top mat')], buildAlpineMountaineer),
  charAsset(metaAt('noir-trench-detective'),
    [rig('MagnifierArm', 'Magnifying glass', 'x', [-45, 25], 'Raises the brass detective inspection glass')],
    [det('DetectiveFedora', 'Detective fedora', 'Classic wide-brimmed noir fedora hat')], buildNoirTrenchDetective),
  charAsset(metaAt('studio-painter'),
    [rig('BrushArm', 'Paintbrush', 'z', [-30, 35], 'Sweeps the studio artist brush across the canvas')],
    [det('ArtistBeret', 'Artist beret', 'Slouched wool painter beret cap')], buildStudioPainter),
  charAsset(metaAt('master-carpenter'),
    [rig('HandSaw', 'Carpenter saw', 'x', [-35, 35], 'Rocks the toothed woodworking hand saw')],
    [det('SawTote', 'Lumber tool tote', 'Back-mounted workshop box carrying timber stock')], buildMasterCarpenter),
  charAsset(metaAt('harvest-farmer'),
    [rig('HarvestTool', 'Harvest fork', 'x', [-30, 30], 'Tilts the three-tine farm pitchfork')],
    [det('StrawHat', 'Straw hat', 'Broad woven sun hat with ribbon band')], buildHarvestFarmer),
  charAsset(metaAt('railway-conductor'),
    [rig('SignalLantern', 'Signal lantern', 'z', [-35, 35], 'Swings the glowing brass railway signal lantern')],
    [det('ConductorCap', 'Conductor cap', 'Tall pillbox conductor uniform cap')], buildRailwayConductor),
  charAsset(metaAt('dig-archaeologist'),
    [rig('DigTrowel', 'Excavation trowel', 'x', [-40, 35], 'Pivots the pointed steel field excavation trowel')],
    [det('BushHat', 'Expedition hat', 'Wide-brimmed slouch archaeology bush hat')], buildDigArchaeologist),
  charAsset(metaAt('urban-skater'),
    [rig('SkateHeadset', 'DJ headphones', 'y', [-30, 30], 'Twists the over-ear street headphones')],
    [det('SkateDeck', 'Skateboard deck', 'Vertically strapped street skateboard with trucks and wheels')], buildUrbanSkater),
  charAsset(metaAt('kimono-silk-weaver'),
    [rig('SilkFan', 'Folding fan', 'z', [-40, 40], 'Waves the pleated traditional silk hand fan')],
    [det('HairOrnament', 'Hairpin crown', 'Ornamental bun comb and beaded kanzashi pins')], buildKimonoSilkWeaver),
  charAsset(metaAt('maritime-harbor-captain'),
    [rig('HarborGlass', 'Captain spyglass', 'x', [-40, 20], 'Raises the brass harbor observation spyglass')],
    [det('CaptainOilHat', 'Souwester hat', 'Flared yellow oilskin rain hat')], buildMaritimeHarborCaptain),
  charAsset(metaAt('astronomy-professor'),
    [rig('ArmillaryOrb', 'Armillary sphere', 'y', [0, 360], 'Spins the brass celestial armillary sphere')],
    [det('Mortarboard', 'Mortarboard cap', 'Square academic cap with braided gold tassel')], buildAstronomyProfessor),
  charAsset(metaAt('bicycle-florist'),
    [rig('WateringCan', 'Watering can', 'x', [-35, 35], 'Tilts the spouted florist watering can')],
    [det('BoaterHat', 'Straw boater', 'Flat-crowned floral-banded straw boater hat')], buildBicycleFlorist),
];
