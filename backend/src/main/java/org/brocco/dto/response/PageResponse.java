package org.brocco.dto.response;

import java.util.List;

public class PageResponse<T> {
    
    public List<T> content;
    public int page;
    public int size;
    public long total;
    public int totalPages;

    public PageResponse() {}

    public PageResponse(List<T> content, long total, int page, int size) {
        this.content = content;
        this.total = total;
        this.page = page;
        this.size = size;
        this.totalPages = (int) Math.ceil((double) total / size);
    }
}