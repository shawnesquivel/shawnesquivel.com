import { solve, type Board } from "./board";
import type { Dictionary } from "./dictionary";

// Everyday words for the opening hint; the full dictionary is full of words like "nae" and "mir".
const COMMON = `
act add age ago aid aim air all and ant any ape arm art ask ate bad bag ban bar bat bay bed bee bet big bin bit
bog boo bow box boy bud bug bun bus but buy cab can cap car cat cop cot cow cry cub cue cup cut dad day den dew
did die dig dim dip dog dot dry due dug dye ear eat egg elf elm end era eve eye fan far fat fed fee few fig fin
fir fit fix fly foe fog for fox fry fun fur gap gas gel gem get gin god got gum gun gut guy gym had ham has hat
hay hen her hid him hip his hit hog hop hot how hug hum hut ice ill ink inn ion its jam jar jaw jet job jog joy
key kid kin kit lab lad lap law lay led leg let lid lie lip lit log lot low mad man map mat may men met mix mob
mom mop mud mug nap net new nil nod nor not now nut oak oar oat odd off oil old one orb ore our out owe owl own
pad pal pan pat paw pay pea pen pet pie pig pin pit pod pop pot pro pub pun pup put rag ram ran rat raw ray red
rib rid rim rip rob rod rot row rub rug run rye sad sat saw say sea see set sew she shy sin sip sir sit six ski
sky sly sob son sow soy spa spy sun tab tag tan tap tar tea ten the tie tin tip toe ton too top toy try tub tug
two use van vet vow wag war was wax way web wed wet who why wig win wit won wow yam yes yet you zip zoo
also area army baby back ball band bank barn base bath bear beat bell belt best bird blue boat body bone book
boot born boss bowl cake call calm came camp card care cart cash cast cave chin city clay coal coat code coin
cold cone cook cool cope corn cost crew crop cute dark date dawn deal dear deep deer desk dial dice diet dine
dirt dish dive door dose dove down draw drop drum duck dust duty each earn east easy edge else even ever face
fact fail fair fall fame farm fast fear feed feel feet file fill film find fine fire fish five flag flat flow
foam fold folk food foot form fort free frog fuel full fund gain game gate gave gear gift girl give glad glow
goal goat gold golf gone good grab gray grew grin grow hair half hall hand hard harm hate have head heal hear
heat held help herb here hero hide high hill hint hire hold hole home hope horn hose host hour huge hunt idea
iron item jump just keen keep kept kick kind king kiss kite knee knot know lace lady lake lamp land lane last
late lead leaf lean left lend lens less life lift like lime line lion list live load loan lock long look lord
lose lost loud love luck made mail main make male mall many mark mask mate meal mean meat meet melt menu mild
milk mind mine mint miss mode mole mood moon more most move much nail name near neat neck need nest news next
nice nine node none nose note oven over pace pack page paid pain pair palm park part pass past path peak pear
pick pile pine pink pipe plan play plot plum poem poet pole pond pool poor port pose post pour pull pure push
race rail rain rare rate read real rent rest rice rich ride ring rise risk road roar rock role roll roof room
root rope rose rule rush safe said sail salt same sand save seal seat seed seek seen self sell send ship shoe
shop shot show shut side sign silk sing sink site size skin slow snow soap sock soft soil sold sole some song
soon sort soup spin spot star stay stem step stir stop such suit sure swim tail take tale talk tall tank tape
task team tear tell tent term test text than that them then they thin this tide tile time tiny tire toad told
tone tool tour town tree trip true tube tune turn twin type unit vast very vote wait wake walk wall want warm
wash wave weak wear week well went were west what when wide wife wild will wind wine wing wire wise wish with
wolf wood wool word wore work yard year zero zone
`
  .split(/\s+/)
  .filter(Boolean);
const COMMON_SET = new Set(COMMON);

// A short word on this board to trace as an opening hint: a common one if the board has one.
export function pickHint(board: Board, dict: Dictionary, minLength: number, seed: string): { word: string; path: number[] } | null {
  const all = [...solve(board, dict, minLength)].filter(([w]) => w.length === minLength).sort(([a], [b]) => a.localeCompare(b));
  const common = all.filter(([w]) => COMMON_SET.has(w));
  const pool = common.length ? common : all;
  if (!pool.length) return null;
  const [word, path] = pool[seed.charCodeAt(0) % pool.length];
  return { word, path };
}
