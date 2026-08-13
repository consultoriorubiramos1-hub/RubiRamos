import React from 'react';

interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon: Icon, title, description }) => {
  return (
    <div 
      className="p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 text-center border border-[#E6E3DE] bg-white"
    >
      <div className="mb-6 flex justify-center">
        <div className="h-20 w-20 rounded-full flex items-center justify-center" style={{ backgroundColor: '#FAF9F7' }}>
          <Icon className="h-10 w-10" style={{ color: '#6B8E7B' }} /> 
        </div>
      </div>
      <h3 className="text-xl font-bold mb-4 font-serif" style={{ color: '#2C3E34' }}>{title}</h3>
      <p className="leading-relaxed" style={{ color: '#6E7C72' }}>{description}</p>
    </div>
  );
};

export default FeatureCard;