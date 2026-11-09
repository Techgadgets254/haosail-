import React from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { motion } from "motion/react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  itemNameSingular?: string;
  itemNamePlural?: string;
  scrollToId?: string;
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  itemNameSingular = "item",
  itemNamePlural = "items",
  scrollToId
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const handlePageSelect = (page: number) => {
    if (page < 1 || page > totalPages) return;
    onPageChange(page);
    if (scrollToId) {
      const el = document.getElementById(scrollToId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);
      
      if (currentPage <= 2) {
        end = 3;
      } else if (currentPage >= totalPages - 1) {
        start = totalPages - 2;
      }
      
      if (start > 2) {
        pages.push("...");
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (end < totalPages - 1) {
        pages.push("...");
      }
      
      pages.push(totalPages);
    }
    
    return pages;
  };

  const pages = getPageNumbers();
  const startItemIndex = (currentPage - 1) * itemsPerPage + 1;
  const endItemIndex = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div 
      className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 bg-white border border-slate-200 rounded-2xl p-4 shadow-xs font-mono text-[11px] text-slate-600 w-full"
      id="custom-pagination-container"
    >
      <div className="select-none text-center sm:text-left text-slate-700">
        Showing <span className="text-[#0066CC] font-bold">{startItemIndex}</span> to{" "}
        <span className="text-[#0066CC] font-bold">{endItemIndex}</span> of{" "}
        <span className="text-slate-900 font-bold">{totalItems}</span> {totalItems === 1 ? itemNameSingular : itemNamePlural}
      </div>
      
      <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap justify-center">
        {/* First Page */}
        <button
          disabled={currentPage === 1}
          onClick={() => handlePageSelect(1)}
          className="min-w-[40px] min-h-[40px] sm:min-w-0 sm:min-h-0 p-2 sm:p-1.5 rounded-lg border border-slate-200 hover:border-[#0066CC] hover:text-[#0066CC] disabled:opacity-30 disabled:hover:text-slate-400 disabled:hover:border-slate-200 transition-all cursor-pointer bg-white text-slate-700 active:scale-95 flex items-center justify-center"
          title="First Page"
          id="pagination-first-btn"
        >
          <ChevronsLeft className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
        </button>

        {/* Prev Page */}
        <button
          disabled={currentPage === 1}
          onClick={() => handlePageSelect(currentPage - 1)}
          className="min-w-[40px] min-h-[40px] sm:min-w-0 sm:min-h-0 px-3 py-2 sm:px-2.5 sm:py-1.5 rounded-lg border border-slate-200 hover:border-[#0066CC] hover:text-[#0066CC] disabled:opacity-30 disabled:hover:text-slate-400 disabled:hover:border-slate-200 transition-all cursor-pointer bg-white text-slate-700 active:scale-95 flex items-center gap-1 font-bold uppercase tracking-wider text-[11px] sm:text-[10px]"
          title="Previous Page"
          id="pagination-prev-btn"
        >
          <ChevronLeft className="w-3.5 h-3.5 sm:w-3 sm:h-3" />
          <span className="hidden xs:inline">Prev</span>
        </button>
        
        {/* Page Numbers */}
        {pages.map((page, index) => {
          if (page === "...") {
            return (
              <span 
                key={`ellipsis-${index}`} 
                className="w-8 h-8 sm:w-7 sm:h-7 flex items-center justify-center text-slate-400 select-none font-bold"
              >
                ...
              </span>
            );
          }
          
          const isSelected = currentPage === page;
          return (
            <button
              key={`page-${page}`}
              onClick={() => handlePageSelect(page as number)}
              className={`min-w-[40px] min-h-[40px] sm:min-w-0 sm:min-h-0 w-9 h-9 sm:w-7 sm:h-7 rounded-lg text-xs sm:text-[10px] font-bold transition-all border cursor-pointer active:scale-95 flex items-center justify-center relative ${
                isSelected
                  ? "bg-[#0066CC] text-white border-[#0066CC] font-extrabold shadow-xs"
                  : "bg-white text-slate-700 border-slate-200 hover:border-[#0066CC] hover:text-[#0066CC]"
              }`}
              id={`pagination-page-${page}`}
            >
              <span className={isSelected ? "text-white font-extrabold" : "text-slate-700"}>
                {page}
              </span>
            </button>
          );
        })}

        {/* Next Page */}
        <button
          disabled={currentPage === totalPages}
          onClick={() => handlePageSelect(currentPage + 1)}
          className="min-w-[40px] min-h-[40px] sm:min-w-0 sm:min-h-0 px-3 py-2 sm:px-2.5 sm:py-1.5 rounded-lg border border-slate-200 hover:border-[#0066CC] hover:text-[#0066CC] disabled:opacity-30 disabled:hover:text-slate-400 disabled:hover:border-slate-200 transition-all cursor-pointer bg-white text-slate-700 active:scale-95 flex items-center gap-1 font-bold uppercase tracking-wider text-[11px] sm:text-[10px]"
          title="Next Page"
          id="pagination-next-btn"
        >
          <span className="hidden xs:inline">Next</span>
          <ChevronRight className="w-3.5 h-3.5 sm:w-3 sm:h-3" />
        </button>

        {/* Last Page */}
        <button
          disabled={currentPage === totalPages}
          onClick={() => handlePageSelect(totalPages)}
          className="min-w-[40px] min-h-[40px] sm:min-w-0 sm:min-h-0 p-2 sm:p-1.5 rounded-lg border border-slate-200 hover:border-[#0066CC] hover:text-[#0066CC] disabled:opacity-30 disabled:hover:text-slate-400 disabled:hover:border-slate-200 transition-all cursor-pointer bg-white text-slate-700 active:scale-95 flex items-center justify-center"
          title="Last Page"
          id="pagination-last-btn"
        >
          <ChevronsRight className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
        </button>
      </div>
    </div>
  );
}
