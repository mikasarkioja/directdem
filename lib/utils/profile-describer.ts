/**
 * Poliittinen Selityskone - Profile Describer
 * Generates human-readable titles and descriptions based on Political DNA scores.
 */

export interface DNAStats {
  economic: number;
  liberal: number;
  env: number;
  urban?: number;
  global?: number;
  security?: number;
}

const AXIS_MAP = [
  { 
    id: 'economic', 
    neg: 'Vasemmistolainen', 
    pos: 'Markkinavetoinen', 
    negDesc: 'painottaa vahvaa julkista sektoria ja sosiaalista oikeudenmukaisuutta', 
    posDesc: 'arvostaa vapaata markkinataloutta, yksilön vastuuta ja talouskasvua' 
  },
  { 
    id: 'liberal', 
    neg: 'Liberaali', 
    pos: 'Konservatiivi', 
    negDesc: 'puolustaa yksilönvapauksia ja uusia arvoja', 
    posDesc: 'vaatii perinteiden ja yhteiskunnan vakauden säilyttämistä' 
  },
  { 
    id: 'env', 
    neg: 'Teollisuusmyönteinen', 
    pos: 'Luonnonpuolustaja', 
    negDesc: 'priorisoi luonnonvarojen hyödyntämistä ja taloudellista realismia', 
    posDesc: 'asettaa luonnon monimuotoisuuden ja ilmastotoimet päätöksenteon kärkeen' 
  },
  { 
    id: 'urban', 
    neg: 'Urbaani', 
    pos: 'Aluepuolustaja', 
    negDesc: 'näkee kasvukeskusten kehittämisen ja tehokkuuden keskeisenä', 
    posDesc: 'vaatii koko Suomen asuttuna pitämistä ja palvelujen hajauttamista' 
  },
  { 
    id: 'global', 
    neg: 'Kansallismielinen', 
    pos: 'Globalisti', 
    negDesc: 'korostaa kansallista etua ja itsenäistä päätöksentekoa', 
    posDesc: 'uskoo kansainväliseen yhteistyöhön, EU-integraatioon ja avoimuuteen' 
  },
  { 
    id: 'security', 
    neg: 'Pehmeä linja', 
    pos: 'Turvallisuushakuinen', 
    negDesc: 'painottaa diplomatiaa, rauhaa ja pehmeitä vaikuttamiskeinoja', 
    posDesc: 'kannattaa vahvaa puolustusta, sotilaallista valmiutta ja kovaa turvallisuuspolitiikkaa' 
  }
];

export function generateProfileSummary(scores: DNAStats) {
  // Normalize scores to handle potential undefined
  const data = {
    economic: scores.economic || 0,
    liberal: scores.liberal || 0,
    env: scores.env || 0,
    urban: scores.urban ?? 0,
    global: scores.global ?? 0,
    security: scores.security ?? 0
  };

  // Find all significant axes (absolute value > 0.2)
  const significant = AXIS_MAP.map(axis => {
    const val = (data as any)[axis.id];
    return {
      axis,
      val,
      abs: Math.abs(val)
    };
  }).filter(item => item.abs > 0.15)
    .sort((a, b) => b.abs - a.abs);

  if (significant.length === 0) {
    return {
      title: 'Keskustahakuinen Pragmaatikko',
      description: 'Äänestyskäyttäytymisesi on tasapainoista ja pragmaattista. Et ole sitoutunut tiukasti mihinkään poliittiseen ääripäähän, vaan harkitset asioita tapauskohtaisesti.'
    };
  }

  // Pick top two axes for the title
  const primary = significant[0];
  const secondary = significant.length > 1 ? significant[1] : null;

  const getLabel = (item: any) => item.val > 0 ? item.axis.pos : item.axis.neg;
  const getDesc = (item: any) => item.val > 0 ? item.axis.posDesc : item.axis.negDesc;

  let title = '';
  if (secondary) {
    title = `${getLabel(secondary)} ${getLabel(primary).toLowerCase()}`;
  } else {
    title = getLabel(primary);
  }

  // Generate description sentences
  const sentences = significant.slice(0, 3).map(item => {
    return `${item.val > 0 ? 'Hän' : 'Hän'} ${getDesc(item)}.`;
  });

  // Small adjustment for "You" vs "He/She" if we want to be fancy
  // But for now, let's keep it neutral
  const description = sentences.join(' ');

  return {
    title,
    description,
    primaryColor: primary.val > 0 ? 'purple' : 'blue'
  };
}


