 //数据上报
const ReportHelper = (function () {

    // 入参
    //https://...xxx.html?user_id=xxx&user_name=xxx&headframe=xxx&path=xxx&class_id=xxx&lesson_id=xxx&push_id=xxx
    // user_id	用户ID
    // user_name	用户名字
    // headframe	头像框
    // path	头像
    // class_id	班级ID
    // lesson_id	讲次ID
    // push_id	推题ID

    // 例
    //http://localhost:8000/index.html?user_id=142233&user_name=test01&headframe=1&path=2&class_id=3&lesson_id=4&push_id=5
 
   function getQueryParams() {
        const params = new URLSearchParams(window.location.search);
        const result = {};

        params.forEach((value, key) => {
            result[key] = decodeURIComponent(value);
        });

        return result;
    }


    // 上报方法
    function report(event_type, event_data = {}) {
        const params = getQueryParams();

        const data = {
            event_type: event_type,
            session_id: "",
            timestamp: Date.now(),
            version: "1.0.0",

            // URL 参数
            user_id: params.user_id || "",
            // user_name: params.user_name || "",
            // headframe: params.headframe || "",
            // path: params.path || "",
            class_id: params.class_id || "",
            lesson_id: params.lesson_id || "",
            push_id: params.push_id || "",

            // 自定义参数
            custom_params: event_data 
        };

        // 如果平台存在接口，调用
        if (window.axxBridge && typeof window.axxBridge.reportLog === "function") {
            const json = JSON.stringify(data);
            window.axxBridge.reportLog(json);
            console.log("[ReportHelper] send:", data);
        } else {
            // 本地调试打印
            console.warn("[ReportHelper] axxBridge.reportLog 不存在 -> 模拟打印", data);
        }
    }
    return {
        report, 
        getQueryParams
    };

})();

 
