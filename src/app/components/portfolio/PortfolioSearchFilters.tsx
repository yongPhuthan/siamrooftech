'use client';

import { useState } from 'react';
import { Search, X, ArrowUpDown, Filter, SlidersHorizontal, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFilter, usePortfolioStore } from '../../../store/portfolioStore';

export default function PortfolioSearchFilters() {
  const filter = useFilter();
  const { setFilter, resetFilter } = usePortfolioStore();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState(filter.searchQuery);

  const handleSearchSubmit = () => {
    setFilter({ searchQuery: localSearchQuery });
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearchSubmit();
    }
  };

  const clearSearch = () => {
    setLocalSearchQuery('');
    setFilter({ searchQuery: '' });
  };

  const handleSortChange = (sortBy: 'newest' | 'oldest' | 'title') => {
    setFilter({ sortBy });
  };

  const isFiltered = filter.searchQuery || filter.activeCategory !== 'ทั้งหมด' || filter.sortBy !== 'newest';

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="ค้นหาโปรเจกต์ (ชื่อ, สถานที่, ประเภท, ลูกค้า...)"
            value={localSearchQuery}
            onChange={(e) => setLocalSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyPress}
            className="pl-10 pr-10 bg-white w-full border-gray-200 focus-visible:ring-blue-500"
          />
          {localSearchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              title="เคลียร์การค้นหา"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            onClick={handleSearchSubmit}
            disabled={localSearchQuery === filter.searchQuery}
            className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white font-medium gap-2"
          >
            <Search className="w-4 h-4" />
            ค้นหา
          </Button>

          <Button
            variant="outline"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`px-3 ${showAdvanced ? 'bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}
            title="ตัวเลือกการกรอง"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Advanced Filters */}
      <div
        className={`transition-all duration-300 overflow-hidden ${
          showAdvanced ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
        }`}
      >
        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            {/* Sort Options */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">เรียงลำดับ</label>
              <Select value={filter.sortBy} onValueChange={(val) => handleSortChange(val as any)}>
                <SelectTrigger className="w-full bg-white border-gray-200">
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="w-4 h-4 text-gray-400" />
                    <SelectValue placeholder="เรียงลำดับ" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">ใหม่ที่สุด</SelectItem>
                  <SelectItem value="oldest">เก่าที่สุด</SelectItem>
                  <SelectItem value="title">ชื่อโปรเจกต์ (A-Z)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Quick Actions */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">ทางลัดการค้นหา</label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className={`flex-1 bg-white border-gray-200 gap-1 text-xs ${filter.searchQuery.includes('ร้านอาหาร') ? 'border-blue-500 text-blue-600 bg-blue-50' : ''}`}
                  onClick={() => setFilter({
                    searchQuery: 'ร้านอาหาร OR คาเฟ่ OR ร้านค้า',
                  })}
                  disabled={filter.searchQuery.includes('ร้านอาหาร OR คาเฟ่')}
                >
                  <Filter className="w-3.5 h-3.5" />
                  ร้านค้า/คาเฟ่
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className={`flex-1 bg-white border-gray-200 gap-1 text-xs ${filter.searchQuery.includes('บ้าน') ? 'border-blue-500 text-blue-600 bg-blue-50' : ''}`}
                  onClick={() => setFilter({
                    searchQuery: 'บ้าน OR พักอาศัย OR หมู่บ้าน',
                  })}
                  disabled={filter.searchQuery.includes('บ้าน OR พักอาศัย')}
                >
                  <Filter className="w-3.5 h-3.5" />
                  บ้านพักอาศัย
                </Button>
              </div>
            </div>

            {/* Reset Button */}
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={resetFilter}
                disabled={!isFiltered}
                className="w-full md:w-auto border-gray-300 hover:border-red-500 hover:text-red-500 hover:bg-red-50 text-gray-600 transition-colors gap-1.5 font-medium"
              >
                <Trash2 className="w-4 h-4" />
                รีเซ็ตตัวกรองทั้งหมด
              </Button>
            </div>
          </div>

          {/* Search Tips */}
          <div className="text-xs text-blue-700 bg-blue-50/50 p-3 rounded-lg border border-blue-100">
            <p className="font-semibold mb-1">💡 เทคนิคการค้นหา:</p>
            <ul className="space-y-0.5 list-disc pl-4 text-blue-600">
              <li>ใช้คำสำคัญแยกด้วยช่องว่าง หรือคำค้นเช่น &quot;ร้านอาหาร OR คาเฟ่&quot;</li>
              <li>ระบบจะค้นหาจากชื่อโปรเจกต์ สถานที่ติดตั้ง ประเภทกันสาด และลูกค้า</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Active Filters Display */}
      {isFiltered && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-gray-500 font-medium">ตัวกรองที่ใช้งานอยู่:</span>

          {filter.searchQuery && (
            <Badge
              variant="secondary"
              className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 gap-1.5 py-1 px-2.5 rounded-lg text-xs font-semibold"
            >
              <span>ค้นหา: &quot;{filter.searchQuery}&quot;</span>
              <button
                onClick={() => setFilter({ searchQuery: '' })}
                className="text-blue-500 hover:text-blue-700 rounded-full hover:bg-blue-200 p-0.5 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}

          {filter.activeCategory !== 'ทั้งหมด' && (
            <Badge
              variant="secondary"
              className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100 gap-1.5 py-1 px-2.5 rounded-lg text-xs font-semibold"
            >
              <span>หมวดหมู่: {filter.activeCategory}</span>
              <button
                onClick={() => setFilter({ activeCategory: 'ทั้งหมด' })}
                className="text-green-500 hover:text-green-700 rounded-full hover:bg-green-200 p-0.5 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}

          {filter.sortBy !== 'newest' && (
            <Badge
              variant="outline"
              className="bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 gap-1.5 py-1 px-2.5 rounded-lg text-xs font-semibold"
            >
              <span>เรียงลำดับ: {filter.sortBy === 'oldest' ? 'เก่าที่สุด' : filter.sortBy === 'title' ? 'ชื่อโปรเจกต์' : filter.sortBy}</span>
              <button
                onClick={() => setFilter({ sortBy: 'newest' })}
                className="text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-200 p-0.5 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}