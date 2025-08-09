'use client';

import { useState } from 'react';
import { 
  Search as SearchIcon, 
  Clear as ClearIcon,
  Sort as SortIcon,
  FilterList as FilterListIcon,
  Tune as TuneIcon 
} from '@mui/icons-material';
import { 
  TextField, 
  InputAdornment, 
  IconButton, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  Chip, 
  Button,
  Collapse,
  Box
} from '@mui/material';
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
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="flex-1 min-w-0">
          <TextField
            fullWidth
            placeholder="ค้นหาโปรเจกต์ (ชื่อ, สถานที่, ประเภท, ลูกค้า...)"
            value={localSearchQuery}
            onChange={(e) => setLocalSearchQuery(e.target.value)}
            onKeyPress={handleSearchKeyPress}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon className="text-gray-400" />
                </InputAdornment>
              ),
              endAdornment: localSearchQuery && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={clearSearch} title="เคลียร์การค้นหา">
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            variant="outlined"
            size="small"
            className="bg-white"
          />
        </div>

        <div className="flex gap-2">
          <Button
            variant="contained"
            onClick={handleSearchSubmit}
            startIcon={<SearchIcon />}
            className="whitespace-nowrap"
            disabled={localSearchQuery === filter.searchQuery}
          >
            ค้นหา
          </Button>
          
          <IconButton 
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`${showAdvanced ? 'bg-blue-100 text-blue-600' : 'bg-gray-100'}`}
            title="ตัวเลือกการกรอง"
          >
            <TuneIcon />
          </IconButton>
        </div>
      </div>

      {/* Advanced Filters */}
      <Collapse in={showAdvanced}>
        <Box className="p-4 bg-gray-50 rounded-lg border">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            {/* Sort Options */}
            <FormControl size="small" fullWidth>
              <InputLabel>เรียงลำดับ</InputLabel>
              <Select
                value={filter.sortBy}
                label="เรียงลำดับ"
                onChange={(e) => handleSortChange(e.target.value as any)}
                startAdornment={<SortIcon className="mr-2 text-gray-500" />}
              >
                <MenuItem value="newest">ใหม่ที่สุด</MenuItem>
                <MenuItem value="oldest">เก่าที่สุด</MenuItem>
                <MenuItem value="title">ชื่อโปรเจกต์ (A-Z)</MenuItem>
              </Select>
            </FormControl>

            {/* Quick Actions */}
            <div className="flex gap-2">
              <Button
                variant="outlined"
                size="small"
                startIcon={<FilterListIcon />}
                onClick={() => setFilter({ 
                  searchQuery: 'ร้านอาหาร OR คาเฟ่ OR ร้านค้า',
                })}
                disabled={filter.searchQuery.includes('ร้านอาหาร OR คาเฟ่')}
              >
                ร้านค้า
              </Button>
              
              <Button
                variant="outlined"
                size="small"
                startIcon={<FilterListIcon />}
                onClick={() => setFilter({ 
                  searchQuery: 'บ้าน OR พักอาศัย OR หมู่บ้าน',
                })}
                disabled={filter.searchQuery.includes('บ้าน OR พักอาศัย')}
              >
                บ้านพัก
              </Button>
            </div>

            {/* Reset Button */}
            <Button
              variant="outlined"
              size="small"
              onClick={resetFilter}
              disabled={!isFiltered}
              className="justify-self-end"
            >
              รีเซ็ตทั้งหมด
            </Button>
          </div>
        </Box>
      </Collapse>

      {/* Active Filters Display */}
      {isFiltered && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-gray-600 font-medium">กรองที่ใช้งาน:</span>
          
          {filter.searchQuery && (
            <Chip
              label={`ค้นหา: "${filter.searchQuery}"`}
              onDelete={() => setFilter({ searchQuery: '' })}
              color="primary"
              variant="outlined"
              size="small"
            />
          )}
          
          {filter.activeCategory !== 'ทั้งหมด' && (
            <Chip
              label={`หมวด: ${filter.activeCategory}`}
              onDelete={() => setFilter({ activeCategory: 'ทั้งหมด' })}
              color="secondary"
              variant="outlined"
              size="small"
            />
          )}
          
          {filter.sortBy !== 'newest' && (
            <Chip
              label={`เรียง: ${filter.sortBy === 'oldest' ? 'เก่าที่สุด' : filter.sortBy === 'title' ? 'ชื่อโปรเจกต์' : filter.sortBy}`}
              onDelete={() => setFilter({ sortBy: 'newest' })}
              color="default"
              variant="outlined"
              size="small"
            />
          )}
        </div>
      )}

      {/* Search Tips */}
      {showAdvanced && (
        <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-lg">
          <p className="font-medium mb-1">💡 เทคนิคการค้นหา:</p>
          <ul className="space-y-1 ml-4">
            <li>• ใช้ OR สำหรับค้นหาหลายคำ เช่น &quot;ร้านอาหาร OR คาเฟ่&quot;</li>
            <li>• ค้นหาได้ทั้งชื่อโปรเจกต์ สถานที่ ประเภท และชื่อลูกค้า</li>
            <li>• กดปุ่ม Enter หรือคลิก &quot;ค้นหา&quot; เพื่อใช้งาน</li>
          </ul>
        </div>
      )}
    </div>
  );
}