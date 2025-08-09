import React from 'react'

function Footer() {
  return (
    <footer className="bg-gray-800 text-white py-6">
      <div className="container mx-auto text-center">
        <p className="text-sm mb-2">© {(new Date()).getFullYear()} Siamrooftech</p>
        <p className="text-xs text-gray-500">All rights reserved.</p>
      </div>
    </footer>
  );
}


export default Footer
