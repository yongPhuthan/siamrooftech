import Image from 'next/image'
import React from 'react'

function EndSection() {
  return (
    <div className="h-full mt-24 items-center justify-center">
      <Image 
      alt='footer'
      loading='lazy'
      width={1800}
      height={500}
      src="https://assets.siamrooftech.com/site/roof-outline.webp"
      />
    </div>
  )
}

export default EndSection
