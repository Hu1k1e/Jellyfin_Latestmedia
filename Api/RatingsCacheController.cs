using System.Collections.Generic;
using System.Threading.Tasks;
using Jellyfin_Latestmedia.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Jellyfin_Latestmedia.Api
{
    [ApiController]
    [Route("[controller]")]
    [Authorize]
    public class RatingsCacheController : ControllerBase
    {
        private readonly PluginRepository _repository;

        public RatingsCacheController()
        {
            _repository = Plugin.Instance.Repository;
        }

        [HttpGet("Get")]
        [Produces("application/json")]
        public async Task<ActionResult<Dictionary<string, float>>> GetRatings()
        {
            var dict = await _repository.ReadItemAsync<Dictionary<string, float>>("community_ratings_cache");
            if (dict == null)
            {
                // If scheduled task hasn't executed yet, return empty so frontend gracefully falls back
                // to its dynamic iterative API querying pattern.
                return Ok(new Dictionary<string, float>());
            }

            return Ok(dict);
        }
    }
}
