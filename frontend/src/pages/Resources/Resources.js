// Resources.js
import React from 'react';
import { ExternalLink } from 'lucide-react';
import './Resources.css';

/**
 * Resources page component that displays external links to weather resources
 * @component
 * @param {Object} props - Component properties
 * @param {Function} props.setCurrentPage - Function to update current page in parent component
 * @returns {JSX.Element} Resources component
 */
const Resources = ({ setCurrentPage }) => {
  // Define external resources
  const resources = [
    // Original Resources
    {
      id: 'wunderground',
      title: 'Weather Underground - Satellite Maps',
      description:
        'Regional visible satellite imagery from Weather Underground, providing up-to-date weather satellite views.',
      url: 'https://www.wunderground.com/maps/satellite/regional-visible',
      source: 'Weather Underground',
      category: 'Satellite Imagery',
    },
    {
      id: 'goes-east',
      title: 'GOES-East CONUS Viewer',
      description:
        'NOAA GOES-East satellite imagery for the Continental United States, offering various visualization bands and options.',
      url: 'https://www.star.nesdis.noaa.gov/GOES/conus.php?sat=G16',
      source: 'NOAA/NESDIS/STAR',
      category: 'Satellite Imagery',
    },
    {
      id: 'atmos-washington-data',
      title: 'UW Atmospheric Sciences - Data Archive',
      description:
        'University of Washington Atmospheric Sciences department data archive providing historical weather observation data.',
      url: 'https://a.atmos.washington.edu/data/',
      source: 'University of Washington',
      category: 'Data Archives',
    },
    {
      id: 'atmos-washington-loops',
      title: 'UW Atmospheric Sciences - Model Loops',
      description:
        'University of Washington collection of meteorological model loops and animations.',
      url: 'https://a.atmos.washington.edu/~ovens/loops/',
      source: 'University of Washington',
      category: 'Model Visualizations',
    },

    // Weather APIs & Services
    {
      id: 'meteosource',
      title: 'Meteosource Weather API',
      description:
        'Comprehensive weather API offering global forecasts, historical data, and specialized meteorological parameters.',
      url: 'https://www.meteosource.com/',
      source: 'Meteosource',
      category: 'Weather APIs',
    },
    {
      id: 'open-meteo',
      title: 'Open-Meteo Weather API',
      description:
        'Free weather API for non-commercial use with global coverage, offering forecasts, historical data, and climate information.',
      url: 'https://open-meteo.com/',
      source: 'Open-Meteo',
      category: 'Weather APIs',
    },
    {
      id: 'weather-gov-api',
      title: 'Weather.gov API Documentation',
      description:
        'Official API documentation for the National Weather Service, providing access to forecasts, alerts, and observations.',
      url: 'https://www.weather.gov/documentation/services-web-api#/',
      source: 'National Weather Service',
      category: 'Weather APIs',
    },

    // Monitoring & Project Resources
    {
      id: 'aws-cloudwatch',
      title: 'Heimdall AWS CloudWatch Dashboard',
      description:
        'AWS CloudWatch Dashboard for monitoring Heimdall application performance and metrics.',
      url: 'https://cloudwatch.amazonaws.com/dashboard.html?dashboard=Heimdall&context=eyJSIjoidXMtZWFzdC0xIiwiRCI6ImN3LWRiLTE0Nzk5NzEyMDc4NCIsIlUiOiJ1cy1lYXN0LTFfeUN0eFdxY3MyIiwiQyI6IjUwc2VsaHVpbjQwMWRmdjRiYmF1NmxwdHRmIiwiSSI6InVzLWVhc3QtMTphMDk1NGFhOS1iZGZlLTRkZjQtODRkNi0zMWVkODM1NjgzYWYiLCJPIjoiYXJuOmF3czppYW06OjE0Nzk5NzEyMDc4NDpyb2xlL3NlcnZpY2Utcm9sZS9DV0RCU2hhcmluZy1QdWJsaWNSZWFkT25seUFjY2Vzcy1SSjNUUEc1ViIsIk0iOiJQdWJsaWMifQ%3D%3D&start=PT168H&end=null',
      source: 'Amazon Web Services',
      category: 'Monitoring Tools',
    },
    {
      id: 'project-airstorm',
      title: 'Project Airstorm GitHub Repository',
      description:
        'Official GitHub repository for the Airstorm project, containing source code, documentation, and development resources.',
      url: 'https://github.com/Project-AirStorm',
      source: 'GitHub',
      category: 'Project Resources',
    },

    // ECMWF GraphCast Charts
    {
      id: 'ecmwf-graphcast-general',
      title: 'ECMWF GraphCast - Overview',
      description:
        'European Centre for Medium-Range Weather Forecasts (ECMWF) GraphCast model visualization portal.',
      url: 'https://charts.ecmwf.int/?facets=%7B%22Product%20type%22%3A%5B%5D%2C%22Parameters%22%3A%5B%5D%2C%22Type%22%3A%5B%5D%2C%22Range%22%3A%5B%5D%7D&query=graphcast',
      source: 'ECMWF',
      category: 'GraphCast Models',
    },
    {
      id: 'ecmwf-graphcast-temp-z',
      title: 'GraphCast - Temperature & Geopotential',
      description:
        'GraphCast model visualization of temperature and geopotential height at 1000mb level for North America.',
      url: 'https://charts.ecmwf.int/products/graphcast_medium-t-z?base_time=202502211200&level=1000&projection=opencharts_north_america&valid_time=202502211200',
      source: 'ECMWF',
      category: 'GraphCast Models',
    },
    {
      id: 'ecmwf-graphcast-rain-acc',
      title: 'GraphCast - Precipitation Accumulation',
      description:
        'GraphCast model visualization of precipitation accumulation for North America.',
      url: 'https://charts.ecmwf.int/products/graphcast_medium-rain-acc?base_time=202502211200&projection=opencharts_north_america&valid_time=202502211200',
      source: 'ECMWF',
      category: 'GraphCast Models',
    },
    {
      id: 'ecmwf-graphcast-mslp-rain',
      title: 'GraphCast - MSLP & Precipitation',
      description:
        'GraphCast model visualization of mean sea level pressure and precipitation for North America.',
      url: 'https://charts.ecmwf.int/products/graphcast_medium-mslp-rain?base_time=202502211200&interval=6&projection=opencharts_north_america&valid_time=202502211800',
      source: 'ECMWF',
      category: 'GraphCast Models',
    },
    {
      id: 'ecmwf-graphcast-z500-t850',
      title: 'GraphCast - 500hPa Geopotential & 850hPa Temperature',
      description:
        'GraphCast model visualization of 500hPa geopotential height and 850hPa temperature for North America.',
      url: 'https://charts.ecmwf.int/products/graphcast_medium-z500-t850?base_time=202502211200&projection=opencharts_north_america&valid_time=202502211200',
      source: 'ECMWF',
      category: 'GraphCast Models',
    },
    {
      id: 'ecmwf-graphcast-2t-wind',
      title: 'GraphCast - 2m Temperature & Surface Wind',
      description:
        'GraphCast model visualization of 2-meter temperature and surface wind for North America.',
      url: 'https://charts.ecmwf.int/products/graphcast_medium-2t-wind?base_time=202502211200&projection=opencharts_north_america&valid_time=202502211200',
      source: 'ECMWF',
      category: 'GraphCast Models',
    },
    {
      id: 'ecmwf-graphcast-mslp-wind200',
      title: 'GraphCast - MSLP & 200hPa Wind',
      description:
        'GraphCast model visualization of mean sea level pressure and 200hPa wind for North America.',
      url: 'https://charts.ecmwf.int/products/graphcast_medium-mslp-wind200?base_time=202502211200&projection=opencharts_north_america&valid_time=202502211200',
      source: 'ECMWF',
      category: 'GraphCast Models',
    },
    {
      id: 'ecmwf-graphcast-uv-z',
      title: 'GraphCast - Wind Components & Geopotential',
      description:
        'GraphCast model visualization of U-V wind components and geopotential height at 1000mb level for North America.',
      url: 'https://charts.ecmwf.int/products/graphcast_medium-uv-z?base_time=202502211200&level=1000&projection=opencharts_north_america&valid_time=202502211200',
      source: 'ECMWF',
      category: 'GraphCast Models',
    },
    {
      id: 'ecmwf-graphcast-mslp-wind850',
      title: 'GraphCast - MSLP & 850hPa Wind',
      description:
        'GraphCast model visualization of mean sea level pressure and 850hPa wind for North America.',
      url: 'https://charts.ecmwf.int/products/graphcast_medium-mslp-wind850?base_time=202502211200&projection=opencharts_north_america&valid_time=202502211200',
      source: 'ECMWF',
      category: 'GraphCast Models',
    },
  ];

  return (
    <div className="dashboard-container">
      <div className="main-content">
        <div className="resources-body">
          <div className="resources-header">
            <h2 className="content-title">External Weather Resources</h2>
            <p className="content-description">
              Curated collection of external weather resources and tools for
              advanced meteorological data.
            </p>
          </div>

          {/* Group resources by category */}
          {[...new Set(resources.map((r) => r.category))].map((category) => (
            <div key={category} className="resource-category">
              <h3 className="category-title">{category}</h3>
              <div className="resources-grid">
                {resources
                  .filter((r) => r.category === category)
                  .map((resource) => (
                    <div key={resource.id} className="resource-card">
                      <div className="resource-card-header">
                        <h3 className="resource-card-title">
                          {resource.title}
                        </h3>
                        <p className="resource-card-source">
                          {resource.source}
                        </p>
                      </div>
                      <div className="resource-card-body">
                        <p className="resource-card-description">
                          {resource.description}
                        </p>
                        <a
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="resource-link"
                        >
                          Visit Resource <ExternalLink className="link-icon" />
                        </a>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Resources;
