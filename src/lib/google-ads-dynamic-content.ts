import type { ServicePage } from './service-pages';

type SearchParamValue = string | string[] | undefined;
export type SearchParamsLike = Record<string, SearchParamValue>;

type TokenOption = {
  label: string;
};

const AD_KEYWORDS: Record<string, TokenOption & { allowedServices: Array<'retractable' | 'electric'> }> = {
  retractable_awning: {
    label: 'กันสาดพับเก็บได้',
    allowedServices: ['retractable'],
  },
  electric_awning: {
    label: 'กันสาดพับไฟฟ้า',
    allowedServices: ['electric'],
  },
  manual_awning: {
    label: 'กันสาดพับระบบมือหมุน',
    allowedServices: ['retractable'],
  },
};

const AD_AUDIENCES: Record<string, TokenOption & { phrase: string }> = {
  home: {
    label: 'บ้านพักอาศัย',
    phrase: 'สำหรับบ้านพักอาศัย',
  },
  restaurant: {
    label: 'ร้านอาหาร',
    phrase: 'สำหรับร้านอาหาร',
  },
  cafe: {
    label: 'คาเฟ่',
    phrase: 'สำหรับคาเฟ่',
  },
  office: {
    label: 'บริษัทและสำนักงาน',
    phrase: 'สำหรับบริษัทและสำนักงาน',
  },
};

const AD_AREAS: Record<string, TokenOption & { servicePath?: string }> = {
  bangkok: {
    label: 'กรุงเทพ',
    servicePath: '/services/retractable-awning/bangkok',
  },
  nonthaburi: {
    label: 'นนทบุรี',
    servicePath: '/services/retractable-awning/nonthaburi',
  },
  pathum_thani: {
    label: 'ปทุมธานี',
    servicePath: '/services/retractable-awning/pathum-thani',
  },
  nakhon_pathom: {
    label: 'นครปฐม',
  },
  samut_prakan: {
    label: 'สมุทรปราการ',
  },
  ayutthaya: {
    label: 'อยุธยา',
  },
  samut_sakhon: {
    label: 'สมุทรสาคร',
  },
};

const AD_INTENTS: Record<string, TokenOption & { ctaLabel: string; support: string }> = {
  quote: {
    label: 'ประเมินราคา',
    ctaLabel: 'ส่งรูปให้ประเมินทาง LINE',
    support: 'ส่งรูปพื้นที่ หน้ากว้าง และระยะยื่นคร่าวๆ ทีมงานช่วยประเมินระบบที่เหมาะก่อนนัดหน้างาน',
  },
  consult: {
    label: 'ปรึกษาหน้างาน',
    ctaLabel: 'คุยกับทีมติดตั้ง',
    support: 'คุยเรื่องพื้นที่ใช้งาน จุดยึด และรูปแบบที่ต้องการก่อนเลือกมือหมุนหรือมอเตอร์ไฟฟ้า',
  },
  compare: {
    label: 'เปรียบเทียบระบบ',
    ctaLabel: 'ให้ช่วยเทียบระบบ',
    support: 'ช่วยเทียบข้อดีของระบบมือหมุนและมอเตอร์ไฟฟ้าตามขนาดพื้นที่ งบประมาณ และความถี่ในการใช้งาน',
  },
};

export type GoogleAdsDynamicTokens = {
  ad_kw?: string;
  ad_audience?: string;
  ad_area?: string;
  ad_intent?: string;
};

export type GoogleAdsDynamicContent = {
  tokens: GoogleAdsDynamicTokens;
  eyebrow: string;
  h1: string;
  intro: string;
  ctaLabel: string;
  ctaContext: string;
  summary: Array<{
    label: string;
    value: string;
  }>;
  decisionPoints: Array<{
    title: string;
    description: string;
  }>;
  calculatorMock: {
    title: string;
    intro: string;
    inputs: string[];
    linePrompt: string;
  };
  proofEyebrow: string;
  proofTitle: string;
  proofIntro: string;
};

export function resolveGoogleAdsDynamicContent(
  page: ServicePage,
  searchParams: SearchParamsLike = {}
): GoogleAdsDynamicContent | null {
  const pageService = page.slug.includes('electric-retractable-awning') ? 'electric' : 'retractable';
  const requestedKeyword = firstParam(searchParams.ad_kw);
  const requestedAudience = firstParam(searchParams.ad_audience);
  const requestedArea = firstParam(searchParams.ad_area);
  const requestedIntent = firstParam(searchParams.ad_intent);

  const keyword = requestedKeyword ? AD_KEYWORDS[requestedKeyword] : undefined;
  const audience = requestedAudience ? AD_AUDIENCES[requestedAudience] : undefined;
  const intent = requestedIntent ? AD_INTENTS[requestedIntent] : undefined;
  const keywordAllowed = keyword?.allowedServices.includes(pageService) ? keyword : undefined;
  const pageArea = page.location || undefined;
  const requestedAreaOption = requestedArea ? AD_AREAS[requestedArea] : undefined;
  const area =
    pageArea
      ? areaMatchesPage(page.slug, requestedAreaOption)
        ? requestedAreaOption
        : undefined
      : requestedAreaOption;

  if (!keywordAllowed && !audience && !area && !intent) {
    return null;
  }

  const serviceLabel =
    keywordAllowed?.label ||
    (pageService === 'electric' ? 'กันสาดพับไฟฟ้า' : 'กันสาดพับเก็บได้');
  const audiencePhrase = audience ? audience.phrase : '';
  const areaPhrase = (pageArea || area?.label) ? `ใน${pageArea || area?.label}` : '';
  const headlineTail = [audiencePhrase, areaPhrase].filter(Boolean).join(' ');
  const h1 = `ติดตั้ง${serviceLabel}${headlineTail ? ` ${headlineTail}` : ''}`;
  const ctaLabel = intent?.ctaLabel || 'ส่งรูปให้ประเมินทาง LINE';
  const ctaContext =
    intent?.support ||
    'ส่งรูปพื้นที่ หน้ากว้าง และระยะยื่นคร่าวๆ ทีมงานช่วยประเมินระบบที่เหมาะก่อนนัดหน้างาน';
  const audienceLabel = audience?.label || 'บ้าน ร้านค้า หรือธุรกิจ';
  const areaLabel = pageArea || area?.label || 'พื้นที่ให้บริการหลัก';
  const intentLabel = intent?.label || 'ปรึกษาและประเมินหน้างาน';

  return {
    tokens: {
      ...(keywordAllowed ? { ad_kw: requestedKeyword } : {}),
      ...(audience ? { ad_audience: requestedAudience } : {}),
      ...(area || pageArea ? { ad_area: areaTokenForLabel(pageArea) || requestedArea } : {}),
      ...(intent ? { ad_intent: requestedIntent } : {}),
    },
    eyebrow: `บริการติดตั้ง: ${[serviceLabel, audience?.label, pageArea || area?.label]
      .filter(Boolean)
      .join(' / ')}`,
    h1,
    intro: `ต้องการติดตั้ง${serviceLabel}${audience?.label ? `สำหรับ${audience.label}` : 'สำหรับบ้าน ร้านค้า หรือธุรกิจ'}${
      pageArea || area?.label ? `ในพื้นที่${pageArea || area?.label}` : ''
    } ทีม Siamrooftech ช่วยดูรูปหน้างาน ขนาดพื้นที่ จุดยึด และการใช้งานจริงก่อนแนะนำระบบที่เหมาะกับงานของคุณ`,
    ctaLabel,
    ctaContext,
    summary: [
      {
        label: 'บริการ',
        value: serviceLabel,
      },
      {
        label: 'เหมาะกับ',
        value: audienceLabel,
      },
      {
        label: 'พื้นที่',
        value: areaLabel,
      },
      {
        label: 'เป้าหมาย',
        value: intentLabel,
      },
    ],
    decisionPoints: [
      {
        title: 'ดูหน้างานก่อนเลือกมือหมุนหรือไฟฟ้า',
        description:
          'หน้ากว้าง ระยะยื่น จุดยึด และความถี่ในการใช้งานมีผลต่อระบบที่เหมาะสม จึงควรประเมินจากรูปและขนาดจริงก่อน',
      },
      {
        title: 'ส่งรูปแล้วคุยต่อได้เร็วขึ้น',
        description:
          'ถ้ามีรูปพื้นที่จริง 2-3 มุม พร้อมขนาดคร่าวๆ ทีมงานจะช่วยคัดแบบและแนวทางติดตั้งได้ตรงขึ้น',
      },
      {
        title: 'เหมาะกับเจ้าของบ้านและธุรกิจโดยตรง',
        description:
          'โฟกัสงานบ้าน ร้านอาหาร คาเฟ่ บริษัท และสำนักงานที่ต้องการคำแนะนำพร้อมทีมติดตั้ง ไม่เน้นรับงานส่งต่อจากผู้รับเหมา',
      },
    ],
    calculatorMock: {
      title: 'ส่งข้อมูลชุดนี้ เพื่อให้ประเมินได้เร็วขึ้น',
      intro:
        'ราคาขึ้นกับขนาด ระบบ วัสดุ และสภาพหน้างาน เบื้องต้นส่งข้อมูลเหล่านี้ทาง LINE ได้ ทีมงานจะช่วยประเมินแนวทางก่อนนัดดูหน้างาน',
      inputs: [
        `บริการที่สนใจ: ${serviceLabel}`,
        `จังหวัดหรือเขตติดตั้ง: ${areaLabel}`,
        `ลักษณะพื้นที่: ${audienceLabel}`,
        'หน้ากว้างและระยะยื่นโดยประมาณ',
        'รูปพื้นที่จริง 2-3 มุม',
      ],
      linePrompt:
        'ยิ่งข้อมูลครบ ทีมงานยิ่งช่วยแนะนำระบบที่เหมาะและช่วงงบประมาณได้ชัดขึ้น โดยยังไม่สรุปราคาแทนการดูหน้างานจริง',
    },
    proofEyebrow: 'ผลงานที่ตรงกับแคมเปญ',
    proofTitle: `ตัวอย่างงาน${serviceLabel}${headlineTail ? ` ${headlineTail}` : ''}`,
    proofIntro:
      'ตัวอย่างด้านล่างดึงจาก portfolio จริง เพื่อให้ผู้ใช้เห็นหลักฐานประกอบก่อนติดต่อ LINE หรือโทรศัพท์',
  };
}

function firstParam(value: SearchParamValue): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function areaMatchesPage(pageSlug: string, area?: TokenOption & { servicePath?: string }): boolean {
  if (!area) return false;
  return area.servicePath === pageSlug;
}

function areaTokenForLabel(label?: string): string | undefined {
  if (!label) return undefined;
  return Object.entries(AD_AREAS).find(([, area]) => area.label === label)?.[0];
}
