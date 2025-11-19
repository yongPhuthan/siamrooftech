'use client';

const warningCards = [
  {
    src: 'https://assets.siamrooftech.com/medium/7a6166aaa4d6bd66-1763383268896-psbcsx-jpg.jpg',
    alt: 'กันสาดพับเก็บได้พังจากโครงเหล็กไม่ได้รับการยึดที่ถูกต้อง',
    title: 'กันสาดบางรุ่นไม่สามารถรับน้ำหนักได้จริง',
    description:
      'กันสาดราคาถูกบางรุ่นถูกออกแบบมาสำหรับงานเบา เมื่อใช้งานจริงมักจะรับน้ำหนักไม่ได้และมีโอกาสทำให้โครงสร้างบิดตัว หลุดออกจากผนัง หรือพังถล่มลงมาได้ รวมถึงปัญหาจากการติดตั้งที่ไม่แข็งแรงและไม่เหมาะสมกับสภาพหน้างาน',
  },
  {
    src: 'https://assets.siamrooftech.com/medium/9a9c6c4aaf55e698-1763383748186-b17w45-jpg.jpg',
    alt: 'ผ้าใบกันสาดฉีกขาดจากแรงลมและวัสดุคุณภาพต่ำ',
    title: 'ความเสียหายของทรัพย์สินและความปลอดภัยของผู้อยู่อาศัยจากการถูกกันสาดตกใส่',
    description:
      'ความเสี่ยงจากกันสาดถล่ม ทั้งตัวรถ ผนังบ้าน และทรัพย์สินรอบข้างอาจได้รับผลกระทบ รวมถึงเสี่ยงต่อความปลอดภัยของผู้อยู่อาศัย หากโครงสร้างหรือวิธีติดตั้งไม่ได้มาตรฐาน',
  },
  {
    src: 'https://assets.siamrooftech.com/medium/07923f6bdf1c414a-1763383501722-mds2ou-jpg.jpg',
    alt: 'ความเสี่ยงจากการติดตั้งด้วยตัวเองหรือช่างผู้ไม่ชำนาญงาน',
    title: 'ความเสี่ยงจากการติดตั้งโดยผู้ไม่ชำนาญงาน',
    description:
      'การประเมินหรือออกแบบหน้างานเพื่อรับน้ำหนักไม่ถูกต้องหรือไม่เหมาะสมกับวัสดุพื้นผิวหน้างานทำให้กันสาดไม่สามารถรับน้ำหนักได้ การประเมินผนังและสภาพพื้นที่จริงก่อนติดตั้ง—ตั้งแต่ชนิดวัสดุ จุดรับแรง ไปจนถึงความสามารถในการรับน้ำหนักของผิวงาน—จึงเป็นขั้นตอนสำคัญที่ช่วยป้องกันทั้งความเสียหายต่อผนังและลดความเสี่ยงที่กันสาดจะพังถล่มลงมาในอนาคต',
  },
  {
    src: 'https://assets.siamrooftech.com/medium/a6e82cd27b1ce946-1763383748189-n995oi-jpg.jpg',
    alt: 'กันสาดลื่นไถล ราวรองรับไม่ตรง, แขนกันสาดโค้งผิด',
    title: 'วัสดุผ้าใบแบบบาง อายุการใช้งานต่ำ และไม่มีการรับประกันหลังติดตั้ง',
    description:
      'ผ้าใบกันสาดที่ใช้งานในท้องตลาดมีหลายระดับคุณภาพ ซึ่งแตกต่างกันทั้งเนื้อผ้า ความหนา อายุการใช้งาน ความแข็งแรง ความสามารถในการลดอุณหภูมิ การป้องกันน้ำ ความคงทนต่อสภาพอากาศ'
  },
];

function DamageWarningSection() {
  return (
    <section className="bg-gradient-to-b from-white via-gray-50 to-gray-100 border border-gray-200 rounded-3xl mt-12 px-6 py-12 shadow-lg">
      <div className="max-w-6xl mx-auto space-y-10">
        <div className="text-center mb-8 space-y-3">
          <p className="inline-flex items-center justify-center mx-auto rounded-full border border-red-300 bg-red-50 px-4 py-1 text-xs uppercase tracking-[0.5em] text-red-600 font-bold shadow-sm">
            คำเตือนจากสถานการณ์จริง
          </p>
          <h2 className="text-3xl md:text-4xl font-semibold text-gray-900 mt-3">
            ความเสียหายจากกันสาดคุณภาพต่ำและการติดตั้งที่ไม่ได้มาตรฐาน
          </h2>
          <p className="text-base text-gray-600 mt-3 md:px-24 leading-relaxed">
            ตัวอย่างความเสียหายหน้างานจริงที่ลูกค้าส่งมาให้เราประเมินก่อนดำเนินการแก้ไขปัญหาที่มาจากกันสาดคุณภาพต่ำ ลดเสป็ค ราคาถูก และการติดตั้งกันสาดที่ไม่ถูกต้องตามมาตรฐาน ทำให้เกิดความเสียหายต่อทรัพย์สินและความปลอดภัยของผู้อยู่อาศัย
          </p>
        </div>

        <div className="space-y-8">
          {warningCards.map((card, index) => {
            const reverse = index % 2 !== 0;
            return (
              <article
                key={card.title}
                className="rounded-2xl border border-gray-200 bg-white/80 shadow-sm transition hover:shadow-lg"
              >
                <div className={`flex flex-col gap-6 px-6 py-6 lg:flex-row ${reverse ? 'lg:flex-row-reverse' : ''}`}>
                  <div
                    className="relative flex-1 overflow-hidden rounded-xl border border-gray-200 bg-black aspect-[4/3] md:aspect-[3/2] lg:aspect-[4/3] max-h-[360px]"
                    onContextMenu={(event) => event.preventDefault()}
                  >
                    <img
                      src={card.src}
                      alt={card.alt}
                      className="object-cover filter grayscale contrast-90 opacity-90 w-full h-full"
                      loading="lazy"
                    />
                    <span className="absolute inset-x-0 bottom-0 text-center text-xs uppercase tracking-widest text-white/80 bg-black/40 py-1">
                      เหตุการณ์จริง
                    </span>
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <h3 className="text-2xl font-semibold text-gray-900">{card.title}</h3>
                    <p className="mt-3 text-gray-600 text-sm leading-relaxed">{card.description}</p>
                    {/* <p className="mt-6 text-xs text-red-500 font-semibold uppercase tracking-[0.35em]">
                      ผลงานด่วน = ค่าใช้จ่ายซ่อม 2-3 เท่า
                    </p> */}
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-4 text-center bg-gray-900 text-white rounded-2xl p-6 border border-gray-800">
          <p className="text-base leading-relaxed">
ความเสียหายจากโครงสร้างกันสาดที่ไม่แข็งแรง นอกจากต้องเสียค่าใช้จ่ายสูง ยังอาจสร้างปัญหาต่อทรัพย์สินและความปลอดภัยของทุกคนในบ้าน
          </p>
        </div>
      </div>
    </section>
  );
}

export default DamageWarningSection;
