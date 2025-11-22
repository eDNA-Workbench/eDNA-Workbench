// hooks/pagination.js
import { useState, useMemo } from "react";

export const usePagination = ({ totalItems, itemsPerPage, hapItems, hapsPerPage, initialPage = 1 }) => {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [hapPage, setHapPage] = useState(1);

  const totalPages = useMemo(() => Math.ceil(totalItems.length / itemsPerPage), [totalItems, itemsPerPage]);

  const totalHapPages = useMemo(() => Math.ceil(hapItems.length / hapsPerPage), [hapItems, hapsPerPage]);

  const paginatedItems = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return totalItems.slice(startIdx, startIdx + itemsPerPage);
  }, [totalItems, currentPage, itemsPerPage]);

  const currentHapHeaders = useMemo(() => {
    const startHapIdx = (hapPage - 1) * hapsPerPage;
    const endHapIdx = startHapIdx + hapsPerPage;
    return hapItems.slice(startHapIdx, endHapIdx);
  }, [hapItems, hapPage, hapsPerPage]);

  const displayedHeaders = useMemo(() => {
    const staticHeaders = totalItems[0] ? totalItems[0].slice(0, 2) : []; // 固定的表头（例如：基因名称）
    return [...staticHeaders, ...currentHapHeaders];
  }, [totalItems, currentHapHeaders]);

  const handlePageChange = (direction) => {
    setCurrentPage((prevPage) => {
      const nextPage = direction === 'next' ? prevPage + 1 : prevPage - 1;
      return Math.min(Math.max(1, nextPage), totalPages);
    });
  };

  const handleHapPageChange = (direction) => {
    setHapPage((prevPage) => {
      const nextPage = direction === 'next' ? prevPage + 1 : prevPage - 1;
      return Math.min(Math.max(1, nextPage), totalHapPages);
    });
  };

  return {
    currentPage,
    totalPages,
    paginatedItems,
    displayedHeaders,
    currentHapHeaders,
    handlePageChange,
    totalHapPages,
    hapPage,
    handleHapPageChange,
  };
};
