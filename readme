Kilka uwag na temat dodawania bibliotek PHP
W repozytorium nie ma katalogu bibliotek (bo nie powinno go być). Potrzebne biblioteki trzeba sobie pobrać do katalogu projektu.
Lista potrzebnych bibliotek jest w pliku composer.json
Wersje tych bibliotek (i innych wymaganych) są w pliku composer.lock
Biblioteki można pobrać ręcznie, ale łatwiej zrobić to narzędziem o nazwie Composer https://getcomposer.org/
Żeby dodać do projektu bibliotekę php-jwt należy wywołać w terminalu polecenie
composer require firebase/php-jwt
To polecenie utworzy też (lub zaktualizuje pliki composer.json i composer.lock)
Jeśli composer.json i composer.lock zawierają wszystkie potrzebne informacje o bibliotekach wystrczy polecenie
composer install
Jeśli Composer nie jest poprawnie zainstalowany, a jedynie pobrany do katalogu projektu, wtedy przydatne mogą być polecenia:
php composer.phar require firebase/php-jwt
php composer.phar install
