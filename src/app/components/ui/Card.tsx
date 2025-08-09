import Image from 'next/image';
import React from 'react';



function Card({ project }: any) {
    console.log('project', project)
    return (
        <div className="card card-compact rounded-md bg-base-100 border-1 relative">
          <Image
              width={450}
              height={300}
              src={project.image}
              alt={project.title} 
              className="rounded rounded-t-xl "
              loading="lazy"
            />
          
          {/* Title overlay on the image */}
          <div className="absolute bottom-0 left-0 w-full p-3 bg-opacity-70 bg-black rounded-b-xl">
            <h2 className="card-title font_page text-white text-xl md:text-[22px] text-center font-bold">
              {project.title}
            </h2>
          </div>
    
          {/* <div className="card-body p-3 md:p-4">
            <p className="text-sm md:text-base">{project.description}</p>
          </div> */}
        </div>
      );
}

export default Card;
