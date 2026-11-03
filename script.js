$(function () {
    var API_URL = 'https://openlibrary.org/search.json';
    var FIELDS = 'key,title,author_name,first_publish_year,subject,cover_i';

    var CATEGORIES = [
        'fiction', 'fantasy', 'science fiction', 'mystery', 'romance',
        'thriller', 'horror', 'adventure', 'classics', 'historical fiction',
        'biography', 'autobiography', 'history', 'poetry', 'drama',
        'philosophy', 'psychology', 'science', 'mathematics', 'technology',
        'computers', 'business', 'economics', 'self-help', 'health',
        'cooking', 'travel', 'art', 'music', 'religion',
        'politics', 'education', 'sports', 'nature', 'children\'s fiction',
        'young adult'
    ];

    var $categorySelect = $('#categorySelect');
    var $loadBtn = $('#loadBooksBtn');
    var $findBtn = $('#findBtn');
    var $loadMoreBtn = $('#loadMoreBtn');
    var $searchInput = $('#searchInput');
    var $bookList = $('#bookList');
    var $status = $('#statusText');

    var state = { query: '', offset: 0, limit: 50, numFound: 0, loading: false };

    function buildCategories() {
        $.each(CATEGORIES, function (index, category) {
            $categorySelect.append(
                $('<option></option>')
                    .val('subject:"' + category + '"')
                    .text(category.replace(/\b\w/g, function (c) { return c.toUpperCase(); }))
            );
        });
    }

    function normalizeBook(doc) {
        return {
            title: doc.title || 'Untitled',
            author: doc.author_name && doc.author_name.length ? doc.author_name.join(', ') : 'Unknown author',
            year: doc.first_publish_year || '—',
            genre: doc.subject && doc.subject.length ? doc.subject.slice(0, 2).join(' · ') : '—',
            cover: doc.cover_i ? 'https://covers.openlibrary.org/b/id/' + doc.cover_i + '-M.jpg' : ''
        };
    }

    function renderBooks(books, append) {
        if (!append) {
            $bookList.empty();
        }

        $.each(books, function (index, book) {
            var $item = $('<li class="book-item"></li>');

            if (book.cover) {
                $item.append($('<img class="book-cover" alt="">').attr('src', book.cover));
            }

            var $info = $('<div class="book-info"></div>');
            $info.append($('<span class="book-title"></span>').text(book.title));
            $info.append($('<span class="book-author"></span>').text('by ' + book.author));
            $info.append($('<span class="book-meta"></span>').text(book.year + ' · ' + book.genre));
            $item.append($info);

            $bookList.append($item);
        });
    }

    function setBusy(busy) {
        state.loading = busy;
        $loadBtn.prop('disabled', busy);
        $findBtn.prop('disabled', busy);
        $loadMoreBtn.prop('disabled', busy);
    }

    function fetchBooks(query, append) {
        state.query = query;
        var offset = append ? state.offset : 0;

        if (!append) {
            $bookList.empty();
            state.offset = 0;
            state.numFound = 0;
            $loadMoreBtn.prop('hidden', true);
        }

        $status.text((append ? 'Loading more…' : 'Loading books from OpenLibrary…'));
        setBusy(true);

        $.ajax({
            url: API_URL,
            type: 'GET',
            dataType: 'json',
            data: {
                q: query,
                limit: state.limit,
                offset: offset,
                fields: FIELDS
            },
            success: function (data) {
                var docs = data && data.docs ? data.docs : [];

                if (!docs.length) {
                    $status.text(append ? 'No more books to load.' : 'No books returned by OpenLibrary.');
                    $loadMoreBtn.prop('hidden', true);
                    return;
                }

                renderBooks($.map(docs, normalizeBook), append);

                state.offset = offset + docs.length;
                state.numFound = data.numFound || state.offset;

                $status.text('Showing ' + state.offset + ' of ' + state.numFound + ' books.');

                if (state.offset < state.numFound) {
                    $loadMoreBtn.prop('hidden', false);
                } else {
                    $loadMoreBtn.prop('hidden', true);
                }
            },
            error: function (xhr, status, error) {
                $status.text('Request failed: ' + status + ' ' + error);
                $loadMoreBtn.prop('hidden', true);
            },
            complete: function () {
                setBusy(false);
            }
        });
    }

    $loadBtn.on('click', function () {
        fetchBooks($categorySelect.val(), false);
    });

    $loadMoreBtn.on('click', function () {
        if (!state.loading && state.query) {
            fetchBooks(state.query, true);
        }
    });

    function findBook() {
        var name = $.trim($searchInput.val());

        if (!name) {
            $status.text('Enter a book name to search.');
            $searchInput.trigger('focus');
            return;
        }

        fetchBooks(name, false);
    }

    $findBtn.on('click', findBook);

    $searchInput.on('keypress', function (event) {
        if (event.which === 13) {
            findBook();
        }
    });

    buildCategories();
});
