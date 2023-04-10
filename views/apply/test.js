/*设置是否自驾的回显*/
let is_driver = "<%= apply.is_driver %>";
if (is_driver) {
    $("#is_driver").val(is_driver);
    form.render();
}
/*设置初始情况下是否显示司机选择列表*/
if (is_driver == 2) {
    $(".driver").show();
} else {
    $(".driver").hide();
}

if (type === "detail") {//详情
    $("#edit input").prop("disabled", true);
    $("#edit textarea").prop("disabled", true);
    $("#edit select").prop("disabled", true);

    $(".apply-btn,.department-btn,.admin-btn").hide();

    $(".exam-info").show();
} else {//添加、修改、审核
    $(".exam-info").hide();
    if (power == 1) {
        $(".department").show();
        $(".admin").show();
        $(".apply-btn").hide();
        $(".department-btn").hide();
        $(".admin-driver").hide();

        $(".apply-info input").prop("disabled", true);
        $(".apply-info textarea").prop("disabled", true);
        $(".apply-info select").prop("disabled", true);
        $(".department textarea").prop("disabled", true);

    } else if (power == 2 && type == "exam") {
        $(".department").show();
        $(".admin").hide();
        $(".apply").hide();
        $(".apply-btn").hide();
        $(".apply-info input").prop("disabled", true);
        $(".apply-info textarea").prop("disabled", true);
        $(".apply-info select").prop("disabled", true);
    } else {
        $(".department").hide();
        $(".admin").hide();
        $(".apply").show();
    }
}


/*司机下拉框*/

