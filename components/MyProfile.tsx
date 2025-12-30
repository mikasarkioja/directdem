"use client";

import PartyMatchCard from "./PartyMatchCard";

export default function MyProfile() {
  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-nordic-darker mb-6">Oma profiili</h2>
        
        {/* Party Match Card */}
        <div className="mb-8">
          <PartyMatchCard />
        </div>
        
        {/* Additional profile settings can go here */}
        <div className="bg-white rounded-lg p-8 shadow-sm border border-nordic-gray">
          <h3 className="text-xl font-semibold text-nordic-darker mb-4">Profiiliasetukset</h3>
          <p className="text-nordic-dark">Lisää profiiliasetuksia tulevaisuudessa...</p>
        </div>
      </div>
    </div>
  );
}


