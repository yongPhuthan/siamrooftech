import React from 'react'
import FinalCTASection from '../components/FinalCTASection';

type Props = {}

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