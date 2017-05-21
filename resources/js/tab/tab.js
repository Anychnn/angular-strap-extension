var main=angular.module("main",['kk.util','ngAnimate']);
// var main=angular.module("tab",['mgcrea.ngStrap','ngAnimate']);
main.controller("tabController",function ($scope) {
    $scope.tabs = [
        {
            "title": "Home",
            "content": "Raw denim you probably haven't heard of them jean shorts Austin. Nesciunt tofu stumptown aliqua, retro synth master cleanse. Mustache cliche tempor, williamsburg carles vegan helvetica."
        },
        {
            "title": "Profile",
            "content": "Food truck fixie locavore, accusamus mcsweeney's marfa nulla single-origin coffee squid. Exercitation +1 labore velit, blog sartorial PBR leggings next level wes anderson artisan four loko farm-to-table craft beer twee."
        },
        {
            "title": "About",
            "content": "Etsy mixtape wayfarers, ethical wes anderson tofu before they sold out mcsweeney's organic lomo retro fanny pack lo-fi farm-to-table readymade.",
            "disabled": true
        }
    ];

    $scope.tabs.activeTab = "Home";
})