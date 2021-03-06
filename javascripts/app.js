$(function() {
  var URL = 'https://its.actindi.net', Issue, Display;
  Issue = function(id) {
    var self = this;
    $.ajax({
      url: URL + "/issues/" + id,
      async: false,
      type: 'get',
      dataType: "html",
      success: function (data) {
        var $data = $(data);
        self.percent = $data.find(".percent").text();
        self.subject = $data.find(".subject h3").text();
        self.status = $data.find("table.attributes td.status").text();
      }
    })
    return self;
  };
  Issue.prototype = {
    formalize: function () {
      return this.subject + "/" + this.status + "(" + this.percent + ")";
    }
  };

  Display = function () {
    this._$containar = $("#containar");
  };
  Display.prototype = {
    flush: function () {
      this._$containar.html('');
    },
    add: function (text)  {
      var x = this._$containar.html()
      this._$containar.html(x + text);
    },
    show_error_msg: function (error_msg) {
      var x = "<div style='color: red;'>" + error_msg + "</div>";
      this._$containar.html(x);
    },
    show_copy_button: function () {
      this._$containar.before(
        "<div>" +
          "<input id='copy' type='button' value='クリップボードにコピーする'>" +
        "</div>"
      );
    }
  };

  // http://stackoverflow.com/questions/3605214/javascript-add-leading-zeroes-to-date
  var get_today = function() {
    var MyDate = new Date();
    return MyDate.getFullYear() + '-' +
      ('0' + (MyDate.getMonth() + 1)).slice(-2) + '-' +
      ('0' + MyDate.getDate()).slice(-2);
  };

  // マイページからuse_idを取得する
  var get_user_id = function() {
    var user_id = 1;
    $.ajax({
      url: URL + '/my/page',
      async: false,
      type: 'get',
      dataType:"html",
      success: function (data) {
        var $link = $(data).find("a.user.active");
        user_id = $link.attr("href").match(/users\/(\d*)/)[1];
      }
    });
    return user_id;
  };

  // 該当日付のチケットidのコレクションを取得する
  var issue_id_set = function () {
    var today = get_today(), id_set = new Set();
    today = "今日"; // 当日に限る
    $.ajax({
      url: URL + '/activity',
      async: false,
      type: 'get',
      dataType: "html",
      data: 'user_id=' + get_user_id(),
      success: function (data) {
        var $today_h3 = undefined;
        $(data).find("h3").each(function(_, h3) {
          var $h3= $(h3);
          if($h3.text() == today) {
            $today_h3 = $h3;
            return;
          }
        });
        if($today_h3 === undefined) {
          $(document).trigger("error", ["今日変更したチケットがありません"]);
        }
        var issues_parent_dom = $today_h3.next();
        issues_parent_dom.find("a").each(function(_, link) {
          var $link = $(link);
          if(/^.issues/.test($link.attr("href"))) { // チケットURLのlinkだけを抽出
            var id = $link.attr("href").match(/issues.(\d*)#?/)[1];
            id_set.add(id);
          }
        });
      }
    })
    return id_set;
  };

  $(document).on("click", "#copy", function () {
    var text = $("#containar").html();
    var clipbox = $("#clipbox");
    text = text.replace(/<br>/g, "\r\n");
    clipbox.val(text);
    clipbox.select();
    document.execCommand('copy');
  });

  $("#fire").click(function(e) {
    var display = new Display();
    display.flush();
    for (var id of issue_id_set().values()) {
      display.add(
        (new Issue(id)).formalize()
      )
      display.add("<br>");
    } // end for
    display.show_copy_button();
  });

  $(document).on("error", function (e, msg) {
    var display = new Display();
    display.flush();
    display.show_error_msg(msg);
  })
});
