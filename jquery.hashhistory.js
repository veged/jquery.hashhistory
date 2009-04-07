/**
 * jQuery hash change event
 *
 * Генерирует событие 'hashChange' (в контексте document)
 * и обеспечивает историю посещений для всех браузеров на любое изменение location.hash.
 * Пример использования: $(document).bind('hashChange', function(e, newHash){ ... });
 * Изменять location.hash можно любым способом, включая обычные ссылки (<a href="#bla">bla</a>).
 *
 * Copyright (c) 2009 Sergey Berezhnoy <veged mail ru>
 */
(function($){
    var $document = $(document),
        iframe,
        hash, // инициализируем пустым, чтобы учесть первоначальный хеш
        // считаем, что только IE нужно насильно записывать хистори (остальные сами справляются)
        needHistoryAdd = /MSIE/.test(navigator.userAgent),
        afterHistoryRead = false,
        afterHistoryAdd = false;

    // функция проверки изменения хеша, она же записывает хистори и вещает основное событие
    function check() {
        if (hash != (hash = document.location.hash)) {
            // если мы только что прочли из хистори, не надо туда записывать
            if (!afterHistoryRead && needHistoryAdd) historyAdd(hash);
            afterHistoryRead = false;
            $document.trigger('hashChange', [hash]);
            console.log('hashChange: ' + hash);
        }
        setTimeout(check, 42); // варварство из-за отсутствия полноценного события
    }

    // функция насильной записи в хистори через скрытый iframe
    function historyAdd(hash) {
        if (!iframe) iframe = $('<iframe style="display:none" src="javascript:false;"></iframe>').appendTo('body')[0];
        var d = iframe.contentDocument ||
            (iframe.contentWindow ? iframe.contentWindow.document : iframe.document);
        d.open();
        // можем позволить себе вольности с незакрытыми тегами, браузер достроит
        d.write('<html><head><title>' + document.title + '</title></head><body>'); // NOTE: потенциальная опасность с ескейпингом document.title
        d.write($('<div/>').append($('<div id="hashdiv"></div>').text(hash)).html()); // типа ради ескейпинга
        // приписываем в тело фрейма скрипт, который будет срабатывать при возвращении на него по хистори
        d.write(
            '<script>' +
                // портим объект window для связи между фреймами
                'window._hash = document.getElementById("hashdiv").innerText;' +
                'window.onload = parent._historyRead;' +
            '</script>'
        );
        afterHistoryAdd = true;
        d.close();
        console.log('historyAdd: ' + hash);
    }

    // для IE немного ускоряем обработку изменения хеша,
    // но поидее можно обойтись постоянно повторяющимся check()
    if ('onpropertychange' in document && 'attachEvent' in document) {
        document.attachEvent('onpropertychange', function(){
            if (event.propertyName == 'location') {
                check();
                console.log('onpropertychange: ' + document.location.hash);
            }
        });
    }

    if (needHistoryAdd) {
        // портим объект window, чтобы работало восстановление хистори через iframe
        window._historyRead = function(){
            console.log('try historyRead: ' + this._hash);
            // если мы только что добавили, читать не надо
            if (!afterHistoryAdd) {
                var newHash = this._hash;
                console.log('newHash: ' + newHash + ', currentHash: ' + document.location.hash);
                // без надобности не присваиваем, как минимум из-за звука "клака" в IE
                if (document.location.hash != newHash) {
                    afterHistoryRead = true;
                    document.location.hash = newHash;
                    console.log('historyRead: ' + newHash);
                }
            }
            afterHistoryAdd = false;
        };
    }

    $(function(){ setTimeout(check, 1) }); // запускаем постоянную проверку с задержкой, чтобы все успели начать слушать события

})(jQuery);

