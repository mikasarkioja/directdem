// lib/utils/party-utils.ts

/**
 * Helper function to map long party names to short abbreviations.
 * This is used across the application for data normalization.
 */
export const formatParty = (party: string, fullName?: string): string => {
  if (!party || party === 'Tuntematon' || party === 'Not a member of a parliamentary group') {
    // Fallback for current MPs if party info is missing
    if (fullName?.includes('Pekka Toveri')) return 'Kok';
    if (fullName?.includes('Sebastian Tynkkynen')) return 'PS';
    if (fullName?.includes('Aura Salla')) return 'Kok';
    if (fullName?.includes('Mikko Polvinen')) return 'PS';
    if (fullName?.includes('Timo Vornanen')) return 'Sit';
    if (fullName?.includes('Osmo Polvinen')) return 'VAS';
    
    // Historical fallbacks
    if (fullName?.includes('Esko Aho')) return 'Kesk';
    if (fullName?.includes('Jukka Tarkka')) return 'Lib';
    if (fullName?.includes('Risto Penttilä')) return 'Kok';
    if (fullName?.includes('Outi Siimes')) return 'Kok';
    if (fullName?.includes('Jari Koskinen')) return 'Kok';
    if (fullName?.includes('Raimo Holopainen')) return 'SDP';
    
    return party === 'Not a member of a parliamentary group' ? 'Sit' : 'N/A';
  }
  
  const p = party.toUpperCase();
  if (p.includes('KOKOOMUS') || p.includes('NATIONAL COALITION')) return 'Kok';
  if (p.includes('SOSIALIDEMOKRAATTI') || p.includes('SOCIAL DEMOCRATIC')) return 'SDP';
  if (p.includes('PERUSSUOMALAISET') || p.includes('FINNS PARTY')) return 'PS';
  if (p.includes('KESKUSTA') || p.includes('CENTRE PARTY')) return 'Kesk';
  if (p.includes('VIHREÄ') || p.includes('GREEN')) return 'Vihr';
  if (p.includes('VASEMMISTO') || p.includes('LEFT ALLIANCE')) return 'Vas';
  if (p.includes('RUOTSALAINEN') || p.includes('SWEDISH')) return 'RKP';
  if (p.includes('KRISTILLISDEMOKRAATTI') || p.includes('CHRISTIAN DEMOCRATIC')) return 'KD';
  if (p.includes('LIIKE NYT')) return 'Liik';
  if (p.includes('VORNANEN')) return 'Sit';
  if (p.includes('NOT A MEMBER') || p.includes('SITOUTUMATON')) return 'Sit';
  if (p.includes('GREEN')) return 'Vihr'; // Additional green check
  
  return party;
};

