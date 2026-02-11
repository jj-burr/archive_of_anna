# Archive Of Anna (previously Zlibrary)

###### After the seizure notice by the USPS, ZLibrary can only be accessed via TOR. Anna's Archive (which I lovingly call Archive of Anna) can be considered as a backup to ZLibrary, Library Genesis and other shadow libraries, so converting this API to be a wrapper of Anna's Archive.

This project is a client library/wrapper API with web scraping capabilities - not a traditional REST API server. Designed to be imported into other Node.js applications.

Key Characteristics:
- Web Scraping Service: Parses HTML from Anna's Archive website using Cheerio
- Wrapper Pattern: Provides programmatic access to Anna's Archive functionality
- Hybrid Approach: Combines web scraping with a proprietary Fast Download API

Architecture overview to utilize wrapper

Your Application → ArchiveOfAnna Class → Web Scraping → Anna's Archive Website
                                      ↓
                              HTML Parsing → Structured Data → Return to User
                                      ↓
                              Download Management → File Downloads → Local Storage

## Installation

TODO: Update this after publishing and describe the installation steps.

## Usage

How It Works
Primary Method: Web scraping Anna's Archive (https://annas-archive.li)
- Extracts book metadata from HTML responses
- Handles search results pagination
- Parses content details pages
Secondary Method: Fast Download API (when secret key available)
- JSON responses from proprietary API endpoint
- Multiple download sources: IPFS, Library Genesis forks, Z-Library Tor

Response Formats
// Search Results
{
  authors: "Author Name",
  coverUrl: "https://...",
  md5: "hash",
  title: "Book Title"
}
// Content Details
{
  title: String,
  authors: Array,
  downloadLinks: { ipfs, libgenRsFork, libgenLiFork, zLibTor },
  extension: String,
  isbnCodes: Array
}

## Development

TODO: Add steps for development of the application. (Do this after adding tests).

## Contributing

Bug reports and pull requests are welcome on GitHub at https://github.com/shettytejas/archive_of_anna. This project is intended to be a safe, welcoming space for collaboration, and contributors are expected to adhere to the [code of conduct](https://github.com/shettytejas/archive_of_anna/blob/master/CODE_OF_CONDUCT.md).

## License

The library is available as open source under the terms of the [MIT License](https://opensource.org/licenses/MIT).

