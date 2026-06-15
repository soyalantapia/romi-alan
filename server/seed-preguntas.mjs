// Siembra el banco de 110 preguntas (idempotente: sólo si la tabla está vacía).
//   DATABASE_URL="postgres://..." PGSSL=true node server/seed-preguntas.mjs
import pg from 'pg'

const NIVEL_1 = [
  '¿Qué fue lo mejor de tu día hoy?',
  '¿Cuál es tu forma favorita de arrancar la mañana?',
  'Si pudieras comer una sola comida por el resto de tu vida, ¿cuál sería?',
  '¿Qué canción te pone de buen humor al instante?',
  '¿Preferís playa o montaña? ¿Por qué?',
  '¿Cuál es tu lugar favorito de nuestra casa?',
  '¿Qué te hace reír sin falla?',
  '¿Cuál es tu placer culpable?',
  'Si tuvieras un día libre sin obligaciones, ¿qué harías?',
  '¿Café, mate o té? ¿Y cómo lo tomás?',
  '¿Cuál es la película o serie que podrías ver mil veces?',
  '¿Qué olor te trae buenos recuerdos?',
  '¿Sos más de planear todo o de improvisar?',
  '¿Cuál fue el mejor regalo que recibiste en tu vida?',
  '¿Qué estación del año es tu favorita y por qué?',
  '¿Cuál es tu snack ideal de medianoche?',
  '¿Qué actividad te hace perder la noción del tiempo?',
  'Si pudiéramos viajar mañana a cualquier lado, ¿a dónde irías?',
  '¿Cuál es tu recuerdo favorito de nosotros hasta ahora?',
  '¿Qué hacés para relajarte después de un día pesado?',
  '¿Sos más de madrugar o de trasnochar?',
  '¿Qué manía tuya reconocés?',
  '¿Qué animal te representa y por qué?',
  '¿Cuál es tu palabra o frase favorita?',
  '¿Qué cosa simple te hace feliz?',
  '¿Cuál es tu plan perfecto para un domingo?',
  '¿Qué comida te recuerda a tu infancia?',
  'Si fueras un personaje de película, ¿quién serías?',
  '¿Qué es algo que siempre quisiste aprender?',
  '¿Cuál es tu prenda favorita y por qué?',
  '¿Preferís una noche tranquila en casa o salir?',
  '¿Qué te dio vergüenza ajena últimamente?',
  '¿Cuál es tu emoji más usado y qué dice de vos?',
  '¿Qué superpoder elegirías para el día a día?',
  '¿Cuál fue lo último que te hizo reír a carcajadas?',
  '¿Qué hábito nuevo te gustaría sumar?',
  '¿Cuál es tu sonido favorito?',
  '¿Qué es lo que más te gusta de tu propia personalidad?',
  'Si tu día de hoy fuera una canción, ¿cuál sería?',
  '¿Cuál es tu manera favorita de que te demuestren cariño?',
]

const NIVEL_2 = [
  '¿Cuál es un recuerdo de tu infancia que te marcó?',
  '¿Qué valor que te enseñó tu familia todavía llevás con vos?',
  '¿Quién fue la persona más influyente en tu vida?',
  '¿De qué momento de tu vida te sentís más orgulloso?',
  '¿Cuál fue el mejor consejo que te dieron?',
  '¿Qué te daba miedo de chico?',
  '¿Cómo eras en la secundaria?',
  '¿Qué soñabas ser cuando eras niño?',
  '¿Cuál fue un punto de quiebre que te cambió?',
  '¿Qué es algo que aprendiste por las malas?',
  '¿Qué tradición te gustaría mantener o crear?',
  '¿Qué parte de tu forma de ser viene de tu mamá o de tu papá?',
  '¿Cuál es un error del que aprendiste mucho?',
  '¿Qué te hace sentir orgulloso de quién sos hoy?',
  '¿Qué creés que la gente malinterpreta de vos?',
  '¿Cuál es tu mayor logro hasta ahora, dentro o fuera del trabajo?',
  '¿Qué es lo que más te frustra de vos mismo?',
  '¿Qué amistad marcó tu vida y por qué?',
  '¿Cuál es una creencia que cambiaste con los años?',
  '¿Qué situación te sacó de tu zona de confort y te hizo crecer?',
  '¿Qué es algo que te costó perdonar?',
  '¿Cómo es tu relación con el dinero y de dónde viene?',
  '¿Qué te hace sentir realmente vivo?',
  '¿Qué parte de tu pasado te gustaría poder rehacer?',
  '¿Cuál es una decisión que estás seguro de haber tomado bien?',
  '¿Qué te gustaría que tu yo de 15 años supiera?',
  '¿Cómo manejás los momentos de bronca o frustración?',
  '¿En qué sos terco?',
  '¿Cuál es tu definición de una buena vida?',
  '¿Qué te genera más inseguridad?',
  '¿Qué te enorgullece de tu familia?',
  '¿Cuál es un sueño que casi no le contaste a nadie?',
  '¿Qué tipo de persona admirás y querés ser?',
  '¿Qué papel juega la fe o la espiritualidad en tu vida?',
  '¿Qué fue lo más difícil que viviste y cómo saliste?',
  '¿Qué te da paz cuando estás mal?',
  '¿Cuál es una meta personal que tenés ahora mismo?',
]

const NIVEL_3 = [
  '¿Qué es algo que nunca le contaste a casi nadie?',
  '¿De qué tenés más miedo en la vida?',
  '¿Qué es lo que más valorás de nosotros dos?',
  '¿En qué momento sentiste que te enamorabas de mí?',
  '¿Qué te gustaría que hiciéramos más seguido juntos?',
  '¿Qué necesitás de mí cuando estás mal y te cuesta pedirlo?',
  '¿Cómo te imaginás nuestra vida en cinco años?',
  '¿Qué es lo que más te cuesta mostrar de vos, incluso conmigo?',
  '¿Qué significa para vos sentirte amado?',
  '¿Hay algo que tengas ganas de decirme y no te animaste?',
  '¿Qué inseguridad tuya te gustaría que yo entienda mejor?',
  '¿Qué cosa mía te sigue enamorando?',
  '¿Cuándo te sentís más conectado conmigo?',
  '¿Qué te da miedo de nuestra relación?',
  '¿Qué herida del pasado todavía cargás?',
  'No el lugar, sino lo que se siente adentro: ¿cómo querés que sea nuestra casa?',
  '¿Qué creés que es lo más lindo que nos pasó juntos?',
  '¿En qué te gustaría que crezcamos como pareja?',
  '¿Qué te hace sentir seguro conmigo?',
  '¿Qué soñás para tu vida que quieras que compartamos?',
  '¿Qué te gustaría que yo supiera sin tener que explicarlo?',
  '¿De qué te arrepentís en la vida?',
  '¿Qué momento conmigo te gustaría volver a vivir?',
  '¿Qué parte de vos sentís que todavía no conozco?',
  'Si supieras que es nuestro último día, ¿qué harías o dirías?',
  '¿Qué es lo que más te gustaría que logremos juntos?',
  '¿Qué le agradecés a la vida de habernos cruzado?',
  '¿Qué te gustaría poder perdonarte a vos mismo?',
  '¿Cuál es tu mayor sueño, ese que casi no decís en voz alta?',
  '¿Qué necesitás para sentir que esta relación es para toda la vida?',
  '¿Qué aprendiste de vos desde que estamos juntos?',
  '¿Cómo querés que te recuerden las personas que amás?',
  '¿Qué le dirías a tu yo del futuro sobre nosotros?',
]

const all = [
  ...NIVEL_1.map((t) => [t, 1]),
  ...NIVEL_2.map((t) => [t, 2]),
  ...NIVEL_3.map((t) => [t, 3]),
]

const cs = process.env.DATABASE_URL
if (!cs) {
  console.error('✖ Falta DATABASE_URL')
  process.exit(1)
}
const ssl = process.env.PGSSL === 'true' || /sslmode=require/.test(cs) ? { rejectUnauthorized: false } : false
const client = new pg.Client({ connectionString: cs, ssl })

try {
  await client.connect()
  const { rows } = await client.query('select count(*)::int as n from preguntas')
  if (rows[0].n > 0) {
    console.log(`Ya hay ${rows[0].n} preguntas, no siembro de nuevo.`)
  } else {
    const values = all.map((_, i) => `($${i * 2 + 1}, $${i * 2 + 2})`).join(', ')
    const params = all.flatMap(([t, n]) => [t, n])
    await client.query(`insert into preguntas (texto, nivel) values ${values}`, params)
    console.log(`✓ Sembradas ${all.length} preguntas (N1: ${NIVEL_1.length}, N2: ${NIVEL_2.length}, N3: ${NIVEL_3.length})`)
  }
} catch (e) {
  console.error('✖ Error sembrando preguntas:', e.message)
  process.exit(1)
} finally {
  await client.end()
}
