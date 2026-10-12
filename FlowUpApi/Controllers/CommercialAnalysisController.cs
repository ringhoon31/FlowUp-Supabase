using Microsoft.AspNetCore.Mvc;
using System.Text;
using System.Text.Json;

namespace FlowUpApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CommercialAnalysisController : ControllerBase
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IConfiguration _configuration;

        public CommercialAnalysisController(IHttpClientFactory httpClientFactory, IConfiguration configuration)
        {
            _httpClientFactory = httpClientFactory;
            _configuration = configuration;
        }

        [HttpPost("analyze")]
        public async Task<IActionResult> AnalyzeStore([FromBody] StoreAnalysisRequestDto request)
        {
            // 1. 요청된 데이터 가공 (추후 오라클 DB/공공 API 연동 지점)
            string summarizedData = $@"
            [상가 위치]: {request.Address}
            [센서 수집 데이터]: 최근 1시간 유동인구 {request.SensorFootTraffic}명, 평균 소음 레벨 {request.SensorNoiseLevel}dB
            [공공 API 데이터]: 반경 500m 내 상가 수 {request.NearbyStoreCount}개, 주요 연령대 {request.MainAgeGroup}
            ";

            // 2. Gemini 프롬프트 작성 (JSON 구조 강제)
            var prompt = $@"
            당신은 전문 상권 분석가입니다. 아래 제공된 데이터를 분석하여 창업가에게 필요한 인사이트를 제공해주세요.

            {summarizedData}

            반드시 아래 JSON 형식 구조로만 답변해주세요 (Markdown 표현식 금지):
            {{
              ""score"": 85,
              ""grade"": ""A"",
              ""summary"": [""요약 문장 1"", ""요약 문장 2"", ""요약 문장 3""],
              ""recommendedTypes"": [""추천업종1"", ""추천업종2""],
              ""notRecommendedTypes"": [""비추천업종1""],
              ""strengths"": [""강점 1"", ""강점 2""],
              ""risks"": [""주의/위험 요인 1""]
            }}";

            // 3. Gemini API 호출
            var apiKey = _configuration["Gemini:ApiKey"];
            if (string.IsNullOrEmpty(apiKey) || apiKey == "여기에_발급받은_GEMINI_API_KEY_입력")
            {
                return BadRequest("appsettings.json에 올바른 Gemini API Key를 입력해주세요.");
            }

            var client = _httpClientFactory.CreateClient();
            var requestBody = new
            {
                contents = new[]
                {
                    new { parts = new[] { new { text = prompt } } }
                },
                generationConfig = new
                {
                    response_mime_type = "application/json"
                }
            };

            var jsonContent = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");
            var response = await client.PostAsync(
                $"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={apiKey}",
                jsonContent
            );

            if (!response.IsSuccessStatusCode)
            {
                var errorMsg = await response.Content.ReadAsStringAsync();
                return StatusCode((int)response.StatusCode, $"Gemini API 오류: {errorMsg}");
            }

            var responseString = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(responseString);

            var rawJsonText = doc.RootElement
                .GetProperty("candidates")[0]
                .GetProperty("content")
                .GetProperty("parts")[0]
                .GetProperty("text")
                .GetString();

            var parsedResult = JsonSerializer.Deserialize<object>(rawJsonText!);
            return Ok(parsedResult);
        }
    }

    public class StoreAnalysisRequestDto
    {
        public string Address { get; set; } = string.Empty;
        public int SensorFootTraffic { get; set; }
        public double SensorNoiseLevel { get; set; }
        public int NearbyStoreCount { get; set; }
        public string MainAgeGroup { get; set; } = string.Empty;
    }
}