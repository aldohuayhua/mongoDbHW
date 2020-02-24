$(document).ready(function() {
  var articleContainer = $("#articles");
  $(document).on("click", ".btn.save", handleArticleSave);
  $(document).on("click", ".scrape-new", handleArticleScrape);
  $(document).on("click", ".btn.delete", handleArticleDelete);

  $(document).on("click", ".show-saved", getSavedArticles);
  $(document).on("click", ".btn.notes", handleArticleNotes);
  $(document).on("click", ".btn.note-save", handleNoteSave);
  $(document).on("click", ".btn.note-delete", handleNoteDelete);

  $(".clear").on("click", handleArticleClear);

  function getArticles(savedState) {
    $.get("/api/headlines?saved=" + savedState).then(function(data) {
      articleContainer.empty();
      if (data && data.length) {
        renderArticles(data, savedState);
      } else {
        renderEmpty();
      }
    });
  }

  function getSavedArticles(e) {
    e.preventDefault();
    getArticles(true);
  }

  function getUnsavedArticles() {
    getArticles(false);
  }

  function renderArticles(articles, savedState) {
    var articleCards = [];
    for (var i = 0; i < articles.length; i++) {
      articleCards.push(createCard(articles[i], savedState));
    }
    articleContainer.append(articleCards);
  }

  function createCard(article, savedState) {
    var card = $("<div class='card' col-lg-6>");
    var button;

    
    if (savedState) {
      button = $(
        "<a class='btn btn-success delete'>Delete From Saved</a> <a class='btn btn-info notes'>Article Notes</a>"
      );
    } else {
      button = $("<a class='btn btn-success save'>Save Article</a>");
    }

    var cardHeader = $("<div class='card-header'>").append(
      $("<h3>").append(
        $("<a class='article-link' target='_blank' rel='noopener noreferrer'>")
          .attr("href", article.url)
          .text(article.headline),
        button
      )
    );

    var cardBody = $("<div class='card-body'>").text(article.summary);

    card.append(cardHeader, cardBody);
    card.data("_id", article._id);
    return card;
  }

  function renderEmpty() {
    $("#empty").show();
  }

  function handleArticleSave() {
    var articleToSave = $(this)
      .parents(".card")
      .data();
    $(this)
      .parents(".card")
      .remove();

    articleToSave.saved = true;
    $.ajax({
      method: "PUT",
      url: "/api/headlines/" + articleToSave._id,
      data: articleToSave
    }).then(function(data) {
      if (data.saved) {
        getUnsavedArticles();
      }
    });
  }

  function handleArticleScrape() {
    $.get("/api/fetch").then(function(data) {
      getUnsavedArticles();
      bootbox.alert($("<h3 class='text-center m-top-80'>").text(data.message));
    });
  }

  function handleArticleClear() {
    $.get("api/clear").then(function() {
      articleContainer.empty();
      getUnsavedArticles();
    });
  }

  function handleArticleDelete() {
    var articleToDelete = $(this)
      .parents(".card")
      .data();

    $(this)
      .parents(".card")
      .remove();
    $.ajax({
      method: "DELETE",
      url: "/api/headlines/" + articleToDelete._id
    }).then(function(data) {
      if (data.ok) {
        getArticles(true);
      }
    });
  }

  function handleArticleNotes(event) {
    var currentArticle = $(this)
      .parents(".card")
      .data();
    $.get("/api/notes/" + currentArticle._id).then(function(data) {
      var modalText = $("<div class='container-fluid text-center'>").append(
        $("<h4>").text("Notes For Article: " + currentArticle._id),
        $("<hr>"),
        $("<ul class='list-group note-container'>"),
        $("<textarea placeholder='New Note' rows='4' cols='60'>"),
        $("<button class='btn btn-success note-save'>Save Note</button>")
      );
      bootbox.dialog({
        message: modalText,
        closeButton: true
      });
      var noteData = {
        _id: currentArticle._id,
        notes: data || []
      };
      $(".btn.note-save").data("article", noteData);
      renderNotesList(noteData);
    });
  }

  function renderNotesList(data) {
    var notesToRender = [];
    var currentNote;
    if (!data.notes.length) {
      currentNote = $("<li class='list-group-item'>No notes for this article yet.</li>");
      notesToRender.push(currentNote);
    } else {
      for (var i = 0; i < data.notes.length; i++) {
        currentNote = $("<li class='list-group-item note'>")
          .text(data.notes[i].noteText)
          .append($("<button class='btn btn-danger note-delete'>x</button>"));
        currentNote.children("button").data("_id", data.notes[i]._id);
        notesToRender.push(currentNote);
      }
    }
    $(".note-container").append(notesToRender);
    $(".bootbox").css("opacity", "1");
  }

  function handleNoteSave() {
    var noteData;
    var newNote = $(".bootbox-body textarea")
      .val()
      .trim();
    if (newNote) {
      noteData = { _headlineId: $(this).data("article")._id, noteText: newNote };
      $.post("/api/notes", noteData).then(function() {
        bootbox.hideAll();
      });
    }
  }

  function handleNoteDelete() {
    var noteToDelete = $(this).data("_id");
    $.ajax({
      url: "/api/notes/" + noteToDelete,
      method: "DELETE"
    }).then(function() {
      bootbox.hideAll();
    });
  }

  getUnsavedArticles();
});
