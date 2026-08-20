import React from 'react'
import FinalCTASection from '../components/FinalCTASection';
import type { Metadata } from 'next';
import { canonicalUrl } from '@/lib/seo-config';

type Props = {}

export const metadata: Metadata = {
  title: 'ผลงานกันสาดพับเก็บได้ทั้งหมด | Siamrooftech',
  description: 'รวมผลงานกันสาดพับเก็บได้จากสยามรูฟเทค สำหรับบ้าน ร้านอาหาร คาเฟ่ บริษัท และสำนักงาน ในกรุงเทพและปริมณฑลใกล้เคียง',
  alternates: {
    canonical: canonicalUrl('/allawning'),
  },
  openGraph: {
    title: 'ผลงานกันสาดพับเก็บได้ทั้งหมด | Siamrooftech',
    description: 'รวมผลงานกันสาดพับเก็บได้จากสยามรูฟเทค สำหรับบ้าน ร้านอาหาร คาเฟ่ บริษัท และสำนักงาน',
    url: canonicalUrl('/allawning'),
  },
};

function Page({}: Props) {
  return (
    <div className="min-h-screen">
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-center mb-8">ผลงานกันสาดทั้งหมด</h1>
          <p className="text-xl text-gray-600 text-center max-w-3xl mx-auto">
            ชมผลงานการติดตั้งกันสาดพับเก็บได้หลากหลายประเภท จากสยามรูฟเทค
          </p>
        </div>
      </div>
      
      <FinalCTASection />
    </div>
  )
}

export default Page
