var main=angular.module("main",['ngAnimate','kk.util']);
main.controller("testController",function ($scope,$timeout,$modal,$modalLoading) {
    $scope.selectedState = "";
    $scope.states = ["Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware","Maine","Maryland","Massachusetts","Michigan","Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey","New Mexico","New York","North Dakota","North Carolina","Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota","Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia","Wisconsin","Wyoming"];

    $scope.title="this is title";

    $scope.selectedAddress = "";


    $scope.selectedIcon = "";
    $scope.selectedIcons = ["Globe","Heart"];
    $scope.icons = [{"value":"Gear","label":"<i class=\"fa fa-gear\"></i> Gear"},{"value":"Globe","label":"<i class=\"fa fa-globe\"></i> Globe"},{"value":"Heart","label":"<i class=\"fa fa-heart\"></i> Heart"},{"value":"Camera","label":"<i class=\"fa fa-camera\"></i> Camera"}];


    $scope.popover = {
        "title": "Title",
        "content": "Hello Popover<br />This is a multiline message!"
    };

    $scope.popoverEdit={
        model:"model",
        title:"this is popover title"
    };

    $scope.modalInfo={
        title:'modalInfo title',
        content:'modalInfo content'
    }

    $scope.showModal=function (info) {
        console.log(info)
    }


    $scope.onModalClick=function () {
        $modal({
            scope:$scope,
            html:'1'
        })
    }
    $scope.onModalLoadingClick=function () {
        var modalLoading=$modalLoading({
            scope:$scope,
            backdropHideOnClick:false
        });
        $timeout(function () {
            modalLoading.hide();
        },1000)
    }

    $scope.onEventLoadingClick=function () {
        //10是对应模态框的id
        $scope.$broadcast('modal.10.show');
        $timeout(function () {
            $scope.$broadcast('modal.10.hide');
        },1000)
    }

    $scope.spinOptions={
        lines: 11
        , length: 6
        , width: 20
        , radius: 20
        , scale: 1.75
        , corners: 1
        , color: 'rgb(255, 255, 255)'
        , opacity: 0.25
        , rotate: 0
        , direction: 1 // 1: 顺时针, -1: 逆时针
        , repeatTime: 1 // 每一轮的时间
        , top: 50
        , left: 50
        , position: 'absolute'
    }

    $scope.slideModel={
        value:$scope.spinOptions.lines,
        maxValue:100
    }


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


    $scope.totalItems = 28;
    $scope.currentPage = 4;
    $scope.series = 10;


    $scope.cropOptions={
        file:null,
        compressed:null,
        rotate:null,
        quality:100,//压缩比  总数100
        size:0,
        compressedSize:0,
        onError:function (type) {
            console.log("error: "+ type);
        }

    };

})