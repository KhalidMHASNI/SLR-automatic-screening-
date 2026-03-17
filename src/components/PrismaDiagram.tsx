import React from 'react';
import { Card, CardContent } from './ui/card';

interface PrismaDiagramProps {
  totalUploaded: number;
  duplicatesRemoved: number;
  screened: number;
  included: number;
  excluded: number;
  maybe: number;
  errors: number;
}

export const PrismaDiagram: React.FC<PrismaDiagramProps> = ({
  totalUploaded,
  duplicatesRemoved,
  screened,
  included,
  excluded,
  maybe,
  errors
}) => {
  return (
    <div className="flex flex-col items-center w-full py-4 text-sm">
      {/* Identification */}
      <div className="w-full max-w-sm flex flex-col items-center">
        <Card className="w-full text-center border-slate-300 shadow-sm">
          <CardContent className="p-3">
            <p className="font-semibold text-slate-900">Records identified</p>
            <p className="text-slate-600">n = {totalUploaded}</p>
          </CardContent>
        </Card>
        
        <div className="h-6 border-l-2 border-slate-300"></div>
        
        <div className="flex w-full items-start justify-center relative">
          <div className="w-1/2 border-t-2 border-slate-300 absolute top-0 right-1/2"></div>
          
          <Card className="w-48 text-center border-slate-300 shadow-sm absolute right-0 -mt-3 mr-4">
            <CardContent className="p-2 text-xs">
              <p className="font-semibold text-slate-900">Duplicates removed</p>
              <p className="text-slate-600">n = {duplicatesRemoved}</p>
            </CardContent>
          </Card>
        </div>
        
        <div className="h-6 border-l-2 border-slate-300"></div>

        {/* Screening */}
        <Card className="w-full text-center border-slate-300 shadow-sm">
          <CardContent className="p-3">
            <p className="font-semibold text-slate-900">Records screened</p>
            <p className="text-slate-600">n = {screened}</p>
          </CardContent>
        </Card>

        <div className="h-6 border-l-2 border-slate-300"></div>

        <div className="flex w-full items-start justify-center relative">
          <div className="w-1/2 border-t-2 border-slate-300 absolute top-0 right-1/2"></div>
          
          <Card className="w-48 text-center border-slate-300 shadow-sm absolute right-0 -mt-3 mr-4">
            <CardContent className="p-2 text-xs">
              <p className="font-semibold text-slate-900">Records excluded</p>
              <p className="text-slate-600">n = {excluded}</p>
              {maybe > 0 && <p className="text-slate-500 mt-1">Maybe: {maybe}</p>}
              {errors > 0 && <p className="text-slate-500">Errors: {errors}</p>}
            </CardContent>
          </Card>
        </div>

        <div className="h-6 border-l-2 border-slate-300"></div>

        {/* Included */}
        <Card className="w-full text-center border-green-500 bg-green-50 shadow-sm">
          <CardContent className="p-3">
            <p className="font-semibold text-green-900">Studies included</p>
            <p className="text-green-700 font-bold">n = {included}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
